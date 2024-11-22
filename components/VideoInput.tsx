'use client';

import { useState, useEffect } from 'react';
import { Youtube, Sparkles, Loader2 } from 'lucide-react';
import { urlSchema } from '@/lib/utils';
import { z } from 'zod';

interface VideoInputProps {
  onSubmit: (url: string) => Promise<void>;
  loading: boolean;
  videoTitle?: string;
}

export default function VideoInput({ onSubmit, loading, videoTitle }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadingMessages = [
    "🎧 Just a moment... I'm listening to the video",
    '🤔 Processing the content...',
    "🧠 Understanding what it's all about",
    '✨ Preparing a concise summary',
    '📝 Almost there, finalizing the details',
  ];

  const funnyMessages = [
    `🎥 Watching "${videoTitle || 'this video'}" at 10x speed`,
    '🚀 Teaching AI to take better notes than your college roommate',
    "🎯 Finding the good parts so you don't have to",
    '🎭 Turning long monologues into bite-sized wisdom',
    '🎪 Performing content acrobatics',
    '🌟 Making YouTube videos shorter since 2024',
  ];

  useEffect(() => {
    if (loading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        const messages = [...loadingMessages, ...(videoTitle ? funnyMessages : [])];
        setLoadingMessage(messages[messageIndex % messages.length]);
        messageIndex++;
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [loading, videoTitle]);

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
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Youtube className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube video URL here..."
          className="w-full pl-12 pr-[100px] sm:pr-32 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm text-[16px]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!url || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Summarize</span>
              <span className="sm:hidden">Go</span>
            </>
          )}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {loading && loadingMessage && (
        <div className="mt-8 flex flex-col items-center justify-center">
          <div className="loading-spinner"></div>
          <p className="mt-6 text-lg font-medium text-gray-700 text-center animate-fade-in">
            {loadingMessage}
          </p>
        </div>
      )}

      {!loading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Try it with any YouTube video! Just paste the URL and let AI do the magic ✨
        </div>
      )}
    </div>
  );
}
