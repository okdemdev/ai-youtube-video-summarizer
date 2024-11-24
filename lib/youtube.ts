import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from 'googleapis';
import https from 'https';
import ytdl, { downloadOptions, getInfoOptions } from '@distube/ytdl-core';

const execAsync = promisify(exec);
let speechClient: SpeechClient;

try {
  // Initialize with credentials from environment variable only
  if (!process.env.GOOGLE_CREDENTIALS) {
    throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
  }

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  console.log('Initializing Speech Client with project ID:', credentials.project_id);

  speechClient = new SpeechClient({
    credentials,
    projectId: credentials.project_id,
  });

  console.log('Speech Client initialized successfully');
} catch (error) {
  console.error('Error initializing Speech Client:', {
    error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    hasCredentials: !!process.env.GOOGLE_CREDENTIALS,
  });
}

const MAX_CHUNK_DURATION = 45; // seconds
const youtube = google.youtube('v3');

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

function createCookieAgent() {
  const cookieString = process.env.YOUTUBE_COOKIES;
  if (!cookieString) {
    console.warn('No YouTube cookies found in environment variables');
    return undefined;
  }

  // Parse cookie string into array of cookie objects
  const cookieObjects = cookieString.split(';').map((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('='); // Rejoin in case value contains =
    return {
      name: name.trim(),
      value: value.trim(),
      domain: '.youtube.com',
      path: '/',
    };
  });

  return ytdl.createAgent(cookieObjects);
}

export async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `${videoId}.wav`);

  try {
    console.log('Downloading audio for video:', videoId);

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const agent = createCookieAgent();

    // Create write stream before starting download
    const fileStream = fs.createWriteStream(outputPath);

    // Additional headers that might help bypass the bot detection
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Connection: 'keep-alive',
      Cookie: process.env.YOUTUBE_COOKIES || '',
      Referer: 'https://www.youtube.com/',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // Get video info with enhanced options
    const info = await ytdl.getInfo(videoUrl, {
      agent,
      requestOptions: { headers },
      lang: 'en',
    });

    // Get only audio formats and sort by quality
    const audioFormats = ytdl
      .filterFormats(info.formats, 'audioonly')
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    if (!audioFormats.length) {
      throw new Error('No audio formats found');
    }

    // Choose the first (highest quality) format
    const format = audioFormats[0];
    console.log('Selected audio format:', format.qualityLabel || format.audioQuality);

    return new Promise<string>((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, {
        format: format,
        agent,
        requestOptions: { headers },
      });

      let error: Error | null = null;
      let dataReceived = false;

      // Set up error handling for the stream
      const handleError = (err: Error) => {
        error = err;
        console.error('Stream error:', err);
        stream.destroy();
        fileStream.destroy();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(err);
      };

      stream.on('error', handleError);
      fileStream.on('error', handleError);

      stream.on('data', (chunk) => {
        dataReceived = true;
      });

      stream.pipe(fileStream);

      fileStream.on('finish', () => {
        if (error) return;

        if (!dataReceived) {
          handleError(new Error('No data received from stream'));
          return;
        }

        try {
          const stats = fs.statSync(outputPath);
          if (stats.size === 0) {
            handleError(new Error('Downloaded file is empty'));
            return;
          }

          console.log('Audio file created successfully at:', outputPath, 'Size:', stats.size);
          resolve(outputPath);
        } catch (err) {
          handleError(err as Error);
        }
      });

      // Add timeout
      const timeout = setTimeout(() => {
        if (!dataReceived) {
          handleError(new Error('Download timeout after 30 seconds'));
        }
      }, 30000);

      // Clear timeout if stream ends or errors
      stream.on('end', () => clearTimeout(timeout));
      stream.on('error', () => clearTimeout(timeout));
    });
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log('Cleaned up invalid file:', outputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    console.error('Error downloading audio:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
      outputPath,
      videoId,
      cookies: process.env.YOUTUBE_COOKIES ? 'Present' : 'Missing',
    });
    throw new Error(
      `Failed to download audio: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  if (!speechClient) {
    throw new Error('Speech client not initialized');
  }

  try {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found at ${audioPath}`);
    }

    console.log('Reading audio file:', audioPath);
    const audio = fs.readFileSync(audioPath);
    console.log('Audio file read, size:', audio.length, 'bytes');

    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };

    const audioLength = audio.length;
    const chunkSize = MAX_CHUNK_DURATION * 16000 * 2; // 2 bytes per sample
    const chunks: Buffer[] = [];

    // Split audio into chunks
    for (let i = 0; i < audioLength; i += chunkSize) {
      const chunk = audio.slice(i, Math.min(i + chunkSize, audioLength));
      chunks.push(chunk);
    }

    console.log('Split audio into', chunks.length, 'chunks');
    let fullTranscript = '';

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}, size:`, chunk.length, 'bytes');

      const request = {
        audio: { content: chunk.toString('base64') },
        config: config,
      };

      try {
        const [response] = await speechClient.recognize(request);
        const transcription = response.results
          ?.map((result) => result.alternatives?.[0]?.transcript)
          .join('\n');

        if (transcription) {
          fullTranscript += transcription + ' ';
          console.log(`Chunk ${i + 1} transcribed successfully, length:`, transcription.length);
        } else {
          console.log(`No transcription returned for chunk ${i + 1}`);
        }
      } catch (chunkError) {
        console.error(`Error transcribing chunk ${i + 1}:`, {
          error: chunkError,
          message: chunkError instanceof Error ? chunkError.message : String(chunkError),
          stack: chunkError instanceof Error ? chunkError.stack : undefined,
        });
        throw chunkError;
      }
    }

    // Cleanup
    try {
      fs.unlinkSync(audioPath);
      console.log('Cleaned up audio file:', audioPath);
    } catch (error) {
      console.error('Error cleaning up audio file:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: audioPath,
      });
    }

    return fullTranscript.trim();
  } catch (error) {
    console.error('Error transcribing audio:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      audioPath,
      fileExists: fs.existsSync(audioPath),
    });
    throw new Error(
      `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    console.log('Using YouTube API Key:', process.env.YOUTUBE_API_KEY ? 'Present' : 'Missing');

    const response = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY, // Using your YouTube API key
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
      throw new Error('Video not found');
    }

    const metadata = {
      videoId,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
      duration: video.contentDetails?.duration || '',
      viewCount: video.statistics?.viewCount || '0',
      channelTitle: video.snippet?.channelTitle || '',
      publishedAt: video.snippet?.publishedAt || '',
    };

    console.log('Successfully fetched metadata:', {
      title: metadata.title,
      duration: metadata.duration,
      channelTitle: metadata.channelTitle,
    });

    return metadata;
  } catch (error) {
    console.error('Error fetching video metadata:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      videoId,
      hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
    });
    throw new Error(
      `Failed to fetch video metadata: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
