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

export const answerQuestion = async (
  question: string,
  transcript: string,
  summary: string,
  metadata: VideoMetadata
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful AI assistant that answers questions about YouTube videos. Use the provided video information to answer the user's question accurately.

Video Title: ${metadata.title}
Video Description: ${metadata.description}

Video Summary:
${summary}

Full Transcript:
${transcript}

User Question: ${question}

Please provide a clear and concise answer based on the video content. If the answer cannot be found in the video content, please state that clearly.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to answer question');
  }
};
