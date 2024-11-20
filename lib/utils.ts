import { z } from 'zod';

export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

export const urlSchema = z.string().url().refine(
  (url) => extractVideoId(url) !== null,
  {
    message: 'Invalid YouTube URL',
  }
);