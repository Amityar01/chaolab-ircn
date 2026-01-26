import { NextRequest, NextResponse } from 'next/server';

// Rate limiting: simple in-memory store (resets on deployment)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Honeypot field name (bots will fill this)
const HONEYPOT_FIELD = 'website';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  website?: string; // Honeypot
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: ContactFormData = await request.json();
    const { name, email, message, website } = body;

    // Honeypot check - if filled, it's likely a bot
    if (website) {
      // Silently accept but don't send (fool the bot)
      return NextResponse.json({ success: true });
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate field lengths
    if (name.length > 100 || email.length > 100 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Field length exceeded' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitize = (str: string) => str.replace(/[<>]/g, '');
    const sanitizedName = sanitize(name.trim());
    const sanitizedMessage = sanitize(message.trim());

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || 'zenas.c.chao@ircn.jp';

    if (resendApiKey) {
      // Send email via Resend
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: 'Chao Lab Website <noreply@chaolab.ircn.jp>',
        to: recipientEmail,
        replyTo: email,
        subject: `[Chao Lab] Contact from ${sanitizedName}`,
        text: `Name: ${sanitizedName}\nEmail: ${email}\n\nMessage:\n${sanitizedMessage}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${sanitizedName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <hr />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${sanitizedMessage}</p>
        `,
      });

      return NextResponse.json({ success: true });
    }

    // Fallback: Log the message (for development or when Resend isn't configured)
    console.warn('[Contact Form] No RESEND_API_KEY configured. Message logged but not sent.');
    console.warn(`From: ${sanitizedName} <${email}>`);
    console.warn(`Message: ${sanitizedMessage.substring(0, 100)}...`);

    return NextResponse.json({
      success: true,
      fallback: true,
      message: 'Email service not configured. Please contact us directly.'
    });

  } catch (error) {
    console.error('Contact form error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
