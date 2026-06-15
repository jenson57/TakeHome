import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages, systemPrompt } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length > 50) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response:', JSON.stringify(data));
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Budget chat error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}