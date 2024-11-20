import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoMetadata } from './youtube';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateSummary = async (transcript: string, metadata: VideoMetadata): Promise<string> => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Please provide a comprehensive summary of the following YouTube video.

Video Title: ${metadata.title}
Video Description: ${metadata.description}

Transcript:
${transcript}

Please focus on the main points, key insights, and important takeaways from the video content.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate summary');
  }
};
