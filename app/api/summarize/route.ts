import { NextResponse } from 'next/server';
import { extractVideoId, urlSchema } from '@/lib/utils';
import { downloadAudio, transcribeAudio, getVideoMetadata } from '@/lib/youtube';
import { generateSummary } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { url } = await req.json();
    console.log('Received URL:', url);

    const validUrl = urlSchema.parse(url);
    const videoId = extractVideoId(validUrl);

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    console.log('Fetching video metadata...');
    const metadata = await getVideoMetadata(videoId);

    console.log('Downloading audio...');
    const audioPath = await downloadAudio(videoId);

    console.log('Transcribing audio...');
    const transcription = await transcribeAudio(audioPath);

    console.log('Generating summary...');
    const summary = await generateSummary(transcription, metadata);

    return NextResponse.json({
      summary,
      metadata,
      transcript: transcription,
    });
  } catch (error: unknown) {
    console.error('Error processing video:', error);
    return NextResponse.json({ error: 'Failed to process video' }, { status: 500 });
  }
}
