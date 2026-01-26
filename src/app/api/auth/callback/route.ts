import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code) {
    return new NextResponse('Missing code parameter', { status: 400 });
  }

  // Verify CSRF state token
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;

  if (!state || !storedState || state !== storedState) {
    return new NextResponse('Invalid state parameter - possible CSRF attack', { status: 403 });
  }

  // Clear the state cookie after verification
  cookieStore.delete('oauth_state');

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return new NextResponse(`OAuth error: ${data.error_description}`, { status: 400 });
    }

    // Safely encode the token data for embedding in HTML
    const tokenData = JSON.stringify({ token: data.access_token, provider: 'github' });
    const escapedTokenData = tokenData
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e');

    const script = `
      <!DOCTYPE html>
      <html>
      <head><title>OAuth Callback</title></head>
      <body>
      <script>
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:' + '${escapedTokenData}',
              e.origin
            );
            window.close();
          }
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        })();
      </script>
      </body>
      </html>
    `;

    return new NextResponse(script, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    // Log only the error message, not the full error object (avoid leaking secrets)
    console.error('OAuth callback error:', error instanceof Error ? error.message : 'Unknown error');
    return new NextResponse('OAuth callback failed', { status: 500 });
  }
}
