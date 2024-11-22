import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoMetadata } from './youtube';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateSummary = async (
  transcript: string,
  metadata: VideoMetadata
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `As an expert content summarizer, create a comprehensive yet engaging summary of this YouTube video.

Video Title: ${metadata.title}
Channel: ${metadata.channelTitle}
Description: ${metadata.description}

Using the following transcript, please provide:

1. 📝 OVERVIEW
A brief (2-3 sentences) overview of what this video is about.

2. 🎯 KEY POINTS
List the main points discussed in the video (use bullet points with emojis that match the content).

3. 💡 KEY INSIGHTS
Share 2-3 most valuable insights or takeaways from the video.

4. 🎬 HIGHLIGHTS
Any particularly interesting moments, quotes, or examples worth noting.

Transcript:
${transcript}

Format the summary in a clean, easy-to-read way using appropriate spacing and emojis. Make it engaging but professional.
Avoid using asterisks or markdown syntax. Use natural language and conversational tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Post-process the text to ensure consistent formatting
    const processedText = text
      .replace(/\*\*/g, '') // Remove any remaining asterisks
      .replace(/\n\n+/g, '\n\n') // Normalize spacing
      .trim();

    return processedText;
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

    const prompt = `You are a knowledgeable AI assistant that helps users understand YouTube video content. 
    You have watched and analyzed this video thoroughly.

Context:
- Video: "${metadata.title}"
- Channel: ${metadata.channelTitle}
- Summary: ${summary}

Full Transcript:
${transcript}

Question: ${question}

Please provide:
1. A clear, direct answer to the question
2. If relevant, include specific examples or quotes from the video
3. If the answer isn't directly addressed in the video, say so clearly
4. Use natural, conversational language
5. If appropriate, use emojis to make the response more engaging

Remember to be helpful and accurate while maintaining a friendly tone.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to answer question');
  }
};
