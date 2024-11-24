import { NextRequest, NextResponse } from 'next/server';
import { downloadAudio } from '@/lib/youtube';
import { extractVideoId } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60; // Set to maximum allowed for hobby plan (60 seconds)

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const videoId = extractVideoId(url);

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const audioPath = await downloadAudio(videoId);

    return NextResponse.json({ success: true, path: audioPath });
  } catch (error) {
    console.error('Error in download route:', error);
    return NextResponse.json(
      { error: 'Failed to download audio', details: String(error) },
      { status: 500 }
    );
  }
}
