'use client';

import { useState, useEffect } from 'react';
import { Youtube } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import VideoInput from '@/components/VideoInput';
import Summary from '@/components/Summary';
import QuestionAnswer from '@/components/QuestionAnswer';
import { VideoMetadata } from '@/lib/youtube';
import { extractVideoId } from '@/lib/utils';

export default function Home() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [transcript, setTranscript] = useState('');
  const [processingTitle, setProcessingTitle] = useState<string>('');

  useEffect(() => {
    const videoId = searchParams.get('video');
    if (videoId) {
      const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
      const savedVideo = savedVideos.find((v: any) => v.id === videoId);

      if (savedVideo) {
        setSummary(savedVideo.summary);
        setMetadata(savedVideo.metadata);
        setTranscript(savedVideo.transcript);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError('');
    setSummary('');
    setMetadata(null);
    setTranscript('');
    setProcessingTitle('');

    try {
      const videoId = extractVideoId(url);
      if (videoId) {
        const metadataResponse = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId }),
        });

        if (metadataResponse.ok) {
          const { metadata } = await metadataResponse.json();
          setProcessingTitle(metadata.title);
        }
      }

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
      setMetadata(data.metadata);
      setTranscript(data.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
      setProcessingTitle('');
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-12">
          <Youtube className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">YouTube Summarizer</h1>
        </div>

        <VideoInput onSubmit={handleSubmit} loading={loading} videoTitle={processingTitle} />

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <Summary
              content={summary}
              isLoading={loading}
              metadata={metadata || undefined}
              transcript={transcript}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 relative">
            <div className="space-y-6">
              <Summary
                content={summary}
                isLoading={loading}
                metadata={metadata || undefined}
                transcript={transcript}
              />
            </div>

            {metadata && summary && transcript && (
              <div className="md:sticky md:top-20 h-fit">
                <QuestionAnswer transcript={transcript} summary={summary} metadata={metadata} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
