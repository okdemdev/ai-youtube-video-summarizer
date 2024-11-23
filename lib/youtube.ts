import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from 'googleapis';

const execAsync = promisify(exec);
let speechClient: SpeechClient;

try {
  // Initialize with credentials from environment variable
  const credentials = process.env.GOOGLE_CREDENTIALS 
    ? JSON.parse(process.env.GOOGLE_CREDENTIALS)
    : require('./google-credentials.json');

  console.log('Initializing Speech Client with project ID:', credentials.project_id);
  
  speechClient = new SpeechClient({
    credentials,
    projectId: credentials.project_id
  });
  
  console.log('Speech Client initialized successfully');
} catch (error) {
  console.error('Error initializing Speech Client:', {
    error,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    hasCredentials: !!process.env.GOOGLE_CREDENTIALS,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
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

export async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `${videoId}.wav`);

  try {
    // Use path relative to project root
    const ytDlpPath = path.join(process.cwd(), 'bin', 'yt-dlp');
    console.log('yt-dlp path:', ytDlpPath);
    console.log('File exists:', fs.existsSync(ytDlpPath));
    
    // Download as WAV format with specific sampling rate and mono channel
    const command = `${ytDlpPath} -x --audio-format wav --audio-quality 0 --postprocessor-args "-ar 16000 -ac 1" -o "${outputPath}" https://www.youtube.com/watch?v=${videoId}`;
    console.log('Executing command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    console.log('Download stdout:', stdout);
    if (stderr) console.error('Download stderr:', stderr);

    if (!fs.existsSync(outputPath)) {
      throw new Error(`Audio file not created at ${outputPath}`);
    }

    console.log('Audio file created successfully at:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error downloading audio:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cwd: process.cwd(),
      outputPath,
      files: fs.readdirSync(process.cwd())
    });
    throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : String(error)}`);
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
          ?.map(result => result.alternatives?.[0]?.transcript)
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
          stack: chunkError instanceof Error ? chunkError.stack : undefined
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
        path: audioPath
      });
    }

    return fullTranscript.trim();
  } catch (error) {
    console.error('Error transcribing audio:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      audioPath,
      fileExists: fs.existsSync(audioPath)
    });
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    console.log('Using YouTube API Key:', process.env.YOUTUBE_API_KEY ? 'Present' : 'Missing');
    
    const response = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,  // Using your YouTube API key
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
      channelTitle: metadata.channelTitle
    });

    return metadata;
  } catch (error) {
    console.error('Error fetching video metadata:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      videoId,
      hasYoutubeKey: !!process.env.YOUTUBE_API_KEY
    });
    throw new Error(`Failed to fetch video metadata: ${error instanceof Error ? error.message : String(error)}`);
  }
}
