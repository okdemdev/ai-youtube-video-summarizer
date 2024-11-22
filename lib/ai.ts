import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoMetadata } from './youtube';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EMOJI_MAP = {
  overview: '📝',
  key_points: '🎯',
  insights: '💡',
  highlights: '🎬',
  tech: '💻',
  business: '💼',
  science: '🔬',
  education: '📚',
  entertainment: '🎭',
  gaming: '🎮',
  music: '🎵',
  sports: '⚽',
  news: '📰',
  tutorial: '🎓',
  review: '⭐',
  analysis: '📊',
  time: '⏱️',
  money: '💰',
  idea: '💭',
  warning: '⚠️',
  tip: '💡',
  example: '📌',
  quote: '💬',
  link: '🔗',
  code: '👨‍💻',
  data: '📊',
};

export const generateSummary = async (
  transcript: string,
  metadata: VideoMetadata
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create an engaging, easy-to-read summary of this YouTube video. Format your response exactly as follows:

OVERVIEW
Write a captivating 2-3 sentence introduction that hooks the reader and explains the video's main topic.

MAIN TAKEAWAYS
• ${EMOJI_MAP.idea} [Core concept/idea]
• ${EMOJI_MAP.example} [Practical example/demonstration]
• ${EMOJI_MAP.tip} [Actionable tip/advice]
• ${EMOJI_MAP.warning} [Important consideration]
(Add 3-5 key points)

VALUABLE INSIGHTS
• ${EMOJI_MAP.idea} [Most important insight with practical application]
• ${EMOJI_MAP.tip} [Secondary insight with real-world relevance]
• ${EMOJI_MAP.example} [Additional insight if particularly valuable]

NOTABLE MOMENTS
• ${EMOJI_MAP.quote} [Memorable quote or statement]
• ${EMOJI_MAP.example} [Standout example or demonstration]
• ${EMOJI_MAP.tip} [Key tip or recommendation]

Context:
Title: ${metadata.title}
Channel: ${metadata.channelTitle}
Description: ${metadata.description}

Transcript:
${transcript}

Important Guidelines:
1. Use natural, conversational language
2. Include specific examples and quotes from the video
3. Make insights actionable and practical
4. Add relevant emojis only at bullet points
5. Keep formatting clean and consistent
6. Focus on value for the viewer`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Ensure emojis are present and format is clean
    const processedText = text
      .replace(/OVERVIEW/g, `${EMOJI_MAP.overview} OVERVIEW`)
      .replace(/MAIN TAKEAWAYS/g, `${EMOJI_MAP.key_points} MAIN TAKEAWAYS`)
      .replace(/VALUABLE INSIGHTS/g, `${EMOJI_MAP.insights} VALUABLE INSIGHTS`)
      .replace(/NOTABLE MOMENTS/g, `${EMOJI_MAP.highlights} NOTABLE MOMENTS`)
      // Remove any duplicate emojis that might appear at the start of sections
      .replace(/[📝🎯💡🎬]\s+[📝🎯💡🎬]/g, (match) => match[0])
      .replace(/\*\*/g, '')
      .replace(/\n\n+/g, '\n\n')
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

    const prompt = `As a knowledgeable and friendly AI assistant, provide a clear and engaging answer to this question about the YouTube video.

Question: ${question}

Use these sources:
1. Video Title: "${metadata.title}"
2. Channel: ${metadata.channelTitle}
3. Summary: ${summary}
4. Full Transcript: ${transcript}

Format your response in a clean, easy-to-read way:

💡 Answer
[Provide a clear, direct response without any markdown formatting]

${EMOJI_MAP.quote} From the Video
[Include 1-2 relevant, brief quotes or examples from the video]

${EMOJI_MAP.tip} Key Points
• [First key point]
• [Second key point]
(Add 2-3 bullet points if relevant)

Guidelines:
1. Keep the response concise and clear
2. Don't use any markdown formatting (no **, *, etc.)
3. Use natural, conversational language
4. Include specific examples when relevant
5. If something isn't covered in the video, say so clearly
6. Keep sections short but informative`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\n\n+/g, '\n\n')
      .trim();

    return text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to answer question');
  }
};
