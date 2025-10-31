import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { assistantId: string } }
) {
  try {
    const { assistantId } = params;
    const body = await request.json();

    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_LANGGRAPH_URL || process.env.LANGGRAPH_API_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }

    // Fetch UI HTML from backend
    const response = await fetch(`${backendUrl}/ui/${assistantId}`, {
      method: 'POST',
      headers: {
        'Accept': 'text/html',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch UI from backend' },
        { status: response.status }
      );
    }

    // Get the HTML content
    let html = await response.text();

    // Replace all HTTP URLs with HTTPS URLs
    // This fixes the mixed content security policy issue
    html = html.replace(/http:\/\//g, 'https://');

    // Return the modified HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('UI proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
