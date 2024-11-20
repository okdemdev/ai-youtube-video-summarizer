'use client';

import { useState } from 'react';
import { Youtube, Sparkles, Loader2 } from 'lucide-react';
import { urlSchema } from '@/lib/utils';
import { z } from 'zod';

interface VideoInputProps {
  onSubmit: (url: string) => Promise<void>;
  loading: boolean;
}

export default function VideoInput({ onSubmit, loading }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const validUrl = urlSchema.parse(url);
      setError('');
      await onSubmit(validUrl);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError('Please enter a valid YouTube URL');
      } else {
        setError('Failed to process video. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="relative">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube video URL here..."
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!url || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Summarize
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
