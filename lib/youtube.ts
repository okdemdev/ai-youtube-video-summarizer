import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { google } from 'googleapis';

const execAsync = promisify(exec);
const speechClient = new SpeechClient();
const MAX_CHUNK_DURATION = 45; // seconds
const youtube = google.youtube('v3');

export interface VideoMetadata {
  title: string;
  description: string;
}

export async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = path.join(os.tmpdir(), `${videoId}.wav`);
  
  try {
    // Download as WAV format with specific sampling rate and mono channel
    const command = `yt-dlp -x --audio-format wav --audio-quality 0 --postprocessor-args "-ar 16000 -ac 1" -o "${outputPath}" https://www.youtube.com/watch?v=${videoId}`;
    await execAsync(command);
    
    return outputPath;
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw new Error('Failed to download audio');
  }
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    
    const audio = fs.readFileSync(audioPath);
    const audioLength = audio.length;
    const chunkSize = MAX_CHUNK_DURATION * 16000 * 2; // 2 bytes per sample
    const chunks = [];

    for (let i = 0; i < audioLength; i += chunkSize) {
      const chunk = audio.slice(i, Math.min(i + chunkSize, audioLength));
      chunks.push(chunk);
    }

    const transcriptionPromises = chunks.map((chunk, index) => {
      const request = {
        audio: {
          content: chunk.toString('base64'),
        },
        config: config,
      };

      return speechClient.recognize(request).then(([response]) => {
        const transcription = response.results
          ?.map(result => result.alternatives?.[0]?.transcript)
          .join('\n');

        return transcription;
      });
    });

    const transcriptions = await Promise.all(transcriptionPromises);
    const transcription = transcriptions.join('\n');

    fs.unlinkSync(audioPath);
    
    return transcription || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    // Clean up the temporary audio file even if transcription fails
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    throw new Error('Failed to transcribe audio');
  }
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    const response = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      id: [videoId],
      part: ['snippet'],
    });

    const video = response.data.items?.[0];
    if (!video) {
      throw new Error('Video not found');
    }

    return {
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new Error('Failed to fetch video metadata');
  }
}
