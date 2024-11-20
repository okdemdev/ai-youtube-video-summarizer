import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateSummary = async (transcript: string): Promise<string> => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Please summarize the following video content. Focus on the main points and key insights:

${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate summary');
  }
};
