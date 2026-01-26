import { NextRequest, NextResponse } from 'next/server';

interface CrossRefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

interface CrossRefResponse {
  message: {
    title?: string[];
    author?: CrossRefAuthor[];
    'container-title'?: string[];
    volume?: string;
    page?: string;
    published?: {
      'date-parts'?: number[][];
    };
    DOI?: string;
    type?: string;
    publisher?: string;
  };
}

// Validate DOI format (10.xxxx/xxxxx pattern)
const DOI_REGEX = /^10\.\d{4,}\/[^\s]+$/;

export async function GET(request: NextRequest) {
  const doi = request.nextUrl.searchParams.get('doi');

  if (!doi) {
    return NextResponse.json({ error: 'Missing DOI parameter' }, { status: 400 });
  }

  // Validate DOI format to prevent malformed URLs
  if (!DOI_REGEX.test(doi)) {
    return NextResponse.json({ error: 'Invalid DOI format' }, { status: 400 });
  }

  try {
    // Fetch from CrossRef API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ChaoLab-Website/1.0 (mailto:zenas.c.chao@ircn.jp)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: 'DOI not found' }, { status: 404 });
    }

    const data: CrossRefResponse = await response.json();
    const work = data.message;

    // Format authors
    const authors = work.author?.map((a: CrossRefAuthor) => {
      if (a.name) return a.name;
      if (a.family && a.given) {
        // Format as "Family GivenInitials" e.g. "Chao ZC"
        const initials = a.given.split(' ').map(n => n[0]).join('');
        return `${a.family} ${initials}`;
      }
      return a.family || 'Unknown';
    }) || [];

    // Get year from published date
    const year = work.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear();

    // Determine type
    let type = 'journal';
    if (work.type === 'book-chapter') type = 'book-chapter';
    else if (work.type === 'proceedings-article') type = 'conference';
    else if (work.type === 'posted-content') type = 'preprint';

    const publication = {
      title: work.title?.[0] || '',
      authors,
      year,
      journal: work['container-title']?.[0] || '',
      volume: work.volume || '',
      pages: work.page || '',
      doi: work.DOI || doi,
      publisher: work.publisher || '',
      type,
    };

    return NextResponse.json(publication);
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'DOI lookup timed out' }, { status: 504 });
    }
    // Log only the error message, not the full error object (security)
    console.error('DOI lookup error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Failed to fetch DOI metadata' }, { status: 500 });
  }
}
