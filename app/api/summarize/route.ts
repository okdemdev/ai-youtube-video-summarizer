import { NextResponse } from 'next/server';
import { extractVideoId, urlSchema } from '@/lib/utils';
import { downloadAudio, transcribeAudio } from '@/lib/youtube';
import { generateSummary } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    console.log('Received URL:', url);

    const validUrl = urlSchema.parse(url);
    const videoId = extractVideoId(validUrl);

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    console.log('Downloading audio...');
    const audioPath = await downloadAudio(videoId);

    console.log('Transcribing audio...');
    const transcription = await transcribeAudio(audioPath);

    console.log('Generating summary...');
    const summary = await generateSummary(transcription);

    return NextResponse.json({ summary });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error processing video:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('Unknown error:', error);
    }
    return NextResponse.json({ error: 'Failed to process video' }, { status: 500 });
  }
}
