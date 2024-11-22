import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/, // Regular YouTube URLs
    /youtube\.com\/shorts\/([^&\n?#]+)/, // YouTube Shorts URLs
    /youtube\.com\/embed\/([^&\n?#]+)/, // Embedded YouTube URLs
    /youtube\.com\/v\/([^&\n?#]+)/, // Old style YouTube URLs
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

export const urlSchema = z
  .string()
  .url()
  .refine((url) => extractVideoId(url) !== null, {
    message: 'Invalid YouTube URL. Please provide a valid YouTube video URL.',
  });
