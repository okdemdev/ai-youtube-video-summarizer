import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from 'googleapis';
import { spawn } from 'child_process';

const execAsync = promisify(exec);
let speechClient: SpeechClient | null = null;

async function initSpeechClient() {
  if (speechClient) return speechClient;

  try {
    const credentials = process.env.GOOGLE_CREDENTIALS;
    if (!credentials) {
      throw new Error('GOOGLE_CREDENTIALS environment variable is not set');
    }

    // Parse credentials directly from environment variable
    const parsedCredentials = JSON.parse(credentials);
    console.log('Initializing Speech Client with project ID:', parsedCredentials.project_id);

    speechClient = new SpeechClient({
      credentials: parsedCredentials,
      projectId: parsedCredentials.project_id,
    });

    console.log('Speech Client initialized successfully');
    return speechClient;
  } catch (error) {
    console.error('Error initializing Speech Client:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

const MAX_CHUNK_DURATION = 45;
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

export async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `${videoId}.wav`);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log('Downloading audio for video:', videoId);

    // Use yt-dlp to download audio with mono channel
    const ytDlpProcess = spawn('yt-dlp', [
      '--extract-audio',
      '--audio-format',
      'wav',
      '--audio-quality',
      '0',
      '--postprocessor-args',
      '-ac 1', // Convert to mono
      '--output',
      outputPath,
      videoUrl,
    ]);

    return new Promise((resolve, reject) => {
      ytDlpProcess.stderr.on('data', (data) => {
        console.log(`yt-dlp stderr: ${data}`);
      });

      ytDlpProcess.on('close', (code) => {
        if (code === 0) {
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            if (stats.size > 0) {
              console.log('Audio file created successfully at:', outputPath, 'Size:', stats.size);
              resolve(outputPath);
            } else {
              reject(new Error('Downloaded file is empty'));
            }
          } else {
            reject(new Error('Output file not found'));
          }
        } else {
          reject(new Error(`yt-dlp process exited with code ${code}`));
        }
      });

      ytDlpProcess.on('error', (err) => {
        reject(new Error(`Failed to start yt-dlp: ${err.message}`));
      });
    });
  } catch (error) {
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
    });
    throw new Error(
      `Failed to download audio: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const client = await initSpeechClient();
    if (!client) {
      throw new Error('Failed to initialize speech client');
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found at ${audioPath}`);
    }

    console.log('Reading audio file:', audioPath);
    const audio = fs.readFileSync(audioPath);
    console.log('Audio file read, size:', audio.length, 'bytes');

    const config = {
      encoding: 'LINEAR16' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };

    const audioLength = audio.length;
    const chunkSize = MAX_CHUNK_DURATION * 48000 * 2;
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
        const [response] = await client.recognize(request);
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

    // Cleanup the audio file
    try {
      fs.unlinkSync(audioPath);
      console.log('Cleaned up audio file:', audioPath);
    } catch (cleanupError) {
      console.error('Error cleaning up audio file:', cleanupError);
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
