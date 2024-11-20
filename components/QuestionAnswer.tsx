import { useState } from 'react';
import { VideoMetadata } from '@/lib/youtube';

interface QuestionAnswerProps {
  transcript: string;
  summary: string;
  metadata: VideoMetadata;
}

export default function QuestionAnswer({ transcript, summary, metadata }: QuestionAnswerProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          transcript,
          summary,
          metadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any question about the video content..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Getting Answer...' : 'Ask Question'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {answer && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Answer:</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
