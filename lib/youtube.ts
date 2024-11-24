import { google } from 'googleapis';

const RAPID_API_KEY = 'c4c53bacdbmsh15f81de270e4fe7p185447jsnfeca2858e5fe';

const getYoutubeClient = () => {
  if (process.env.GOOGLE_CREDENTIALS) {
    // Production: Use JSON credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    return google.youtube({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      }),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Development: Use credentials file
    return google.youtube({
      version: 'v3',
      auth: new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      }),
    });
  } else {
    // Fallback: Use API key directly
    return google.youtube('v3');
  }
};

const youtube = getYoutubeClient();

export interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  channelTitle: string;
  publishedAt: string;
}

export async function transcribeVideo(videoId: string): Promise<string> {
  try {
    console.log('Requesting transcription for video:', videoId);

    const youtubeUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    const url = `https://youtube-transcripts.p.rapidapi.com/youtube/transcript?url=${youtubeUrl}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': 'youtube-transcripts.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      throw new Error(`RapidAPI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);

    if (!data || !data.content || !Array.isArray(data.content)) {
      throw new Error('Invalid response format from API');
    }

    const transcript = data.content
      .map((segment: { text: string; offset: number; duration: number }) => segment.text)
      .join(' ');

    if (!transcript) {
      throw new Error('No transcript available for this video');
    }

    return transcript;
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw new Error('Failed to transcribe video');
  }
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    const response = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
      throw new Error('Video not found');
    }

    return {
      videoId,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
      duration: video.contentDetails?.duration || '',
      viewCount: video.statistics?.viewCount || '0',
      channelTitle: video.snippet?.channelTitle || '',
      publishedAt: video.snippet?.publishedAt || '',
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new Error('Failed to fetch video metadata');
  }
}
