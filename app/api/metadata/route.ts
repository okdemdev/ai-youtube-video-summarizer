import { NextRequest, NextResponse } from 'next/server';
import { getVideoMetadata } from '@/lib/youtube';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const metadata = await getVideoMetadata(videoId);
    return NextResponse.json({ metadata });
  } catch (error: unknown) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch video metadata' }, { status: 500 });
  }
}
