'use client';

import { useState } from 'react';
import { Youtube } from 'lucide-react';
import VideoInput from '@/components/VideoInput';
import Summary from '@/components/Summary';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-24">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-12">
          <Youtube className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">YouTube Summarizer</h1>
        </div>

        <VideoInput onSubmit={handleSubmit} loading={loading} />

        {error && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <Summary content={summary} />
      </div>
    </main>
  );
}
