import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from 'googleapis';
import https from 'https';
import { Readable } from 'stream';

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

// Add this helper function outside the main function
async function streamToReadable(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  readable: Readable
) {
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        readable.push(null); // Signal the end of the stream
        break;
      }
      if (!readable.push(value)) {
        await new Promise((resolve) => readable.once('drain', resolve));
      }
    }
  } catch (err) {
    readable.destroy(
      new Error(`Stream reading error: ${err instanceof Error ? err.message : String(err)}`)
    );
  }
}

export async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `${videoId}.wav`);

  try {
    console.log('Downloading audio for video:', videoId);

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST!,
      },
    };

    const url = `https://${process.env.RAPIDAPI_HOST}/api/dl?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}`;

    console.log('Making RapidAPI request to:', url);
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`RapidAPI request failed: ${error}`);
    }

    const data = await response.json();
    console.log('RapidAPI response:', data);

    if (!data.url) {
      throw new Error('Failed to get audio URL from API');
    }

    const audioResponse = await fetch(data.url);
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file');
    }

    // Create write stream
    const fileStream = fs.createWriteStream(outputPath);

    return new Promise<string>((resolve, reject) => {
      let error: Error | null = null;
      let dataReceived = false;

      const handleError = (err: Error) => {
        error = err;
        console.error('Stream error:', err);
        fileStream.destroy();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(err);
      };

      fileStream.on('error', handleError);

      if (audioResponse.body) {
        const readable = new Readable({
          read() {
            // This function is required but can be empty
          },
        });

        const stream = audioResponse.body.getReader();

        // Start the streaming process
        streamToReadable(stream, readable).catch(handleError);

        readable.on('data', () => {
          dataReceived = true;
        });

        readable.on('end', () => {
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

        readable.on('error', (err) => {
          handleError(err instanceof Error ? err : new Error(String(err)));
        });

        // Pipe the converted stream to file
        readable.pipe(fileStream);

        // Add timeout
        const timeout = setTimeout(() => {
          if (!dataReceived) {
            stream.cancel();
            readable.destroy();
            handleError(new Error('Download timeout after 30 seconds'));
          }
        }, 30000);

        readable.on('end', () => clearTimeout(timeout));
        readable.on('error', () => clearTimeout(timeout));
      } else {
        handleError(new Error('No response body available'));
      }
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
