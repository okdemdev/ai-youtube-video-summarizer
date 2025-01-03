import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, urlSchema } from '@/lib/utils';
import { transcribeVideo, getVideoMetadata } from '@/lib/youtube';
import { generateSummary } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    console.log('Received URL:', url);

    const validUrl = urlSchema.parse(url);
    const videoId = extractVideoId(validUrl);

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    try {
      console.log('Fetching video metadata...');
      const metadata = await getVideoMetadata(videoId);
      console.log('Metadata fetched successfully');

      console.log('Transcribing video...');
      const transcription = await transcribeVideo(videoId);
      console.log('Transcription completed, length:', transcription.length);

      if (!transcription || transcription.length === 0) {
        throw new Error('Failed to transcribe video or transcription is empty');
      }

      console.log('Generating summary...');
      const summary = await generateSummary(transcription, metadata);
      console.log('Summary generated successfully');

      return NextResponse.json({
        summary,
        metadata,
        transcript: transcription,
      });
    } catch (innerError) {
      console.error('Detailed error:', {
        error: innerError,
        message: innerError instanceof Error ? innerError.message : String(innerError),
        stack: innerError instanceof Error ? innerError.stack : undefined,
      });
      throw innerError;
    }
  } catch (error: unknown) {
    console.error('Error processing video:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to process video',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
