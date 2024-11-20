import { NextResponse } from 'next/server';
import { answerQuestion } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { question, transcript, summary, metadata } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!transcript || !summary || !metadata) {
      return NextResponse.json(
        { error: 'Video content is required' },
        { status: 400 }
      );
    }

    const answer = await answerQuestion(question, transcript, summary, metadata);
    return NextResponse.json({ answer });
  } catch (error: unknown) {
    console.error('Error answering question:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
