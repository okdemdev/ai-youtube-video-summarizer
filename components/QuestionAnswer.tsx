import { useState, useEffect } from 'react';
import { VideoMetadata } from '@/lib/youtube';
import { Send, Loader2, Brain, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [previousQAs, setPreviousQAs] = useState<Array<{ question: string; answer: string }>>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load saved Q&As on mount
  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
    const savedVideo = savedVideos.find((v: any) => v.id === metadata.videoId);
    if (savedVideo?.qas) {
      setPreviousQAs(savedVideo.qas);
    }
  }, [metadata.videoId]);

  // Save Q&As to localStorage
  const saveQAs = (newQAs: Array<{ question: string; answer: string }>) => {
    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
    const videoIndex = savedVideos.findIndex((v: any) => v.id === metadata.videoId);

    if (videoIndex !== -1) {
      savedVideos[videoIndex] = {
        ...savedVideos[videoIndex],
        qas: newQAs,
      };
      localStorage.setItem('savedVideos', JSON.stringify(savedVideos));
    }
  };

  // Collapse the previous Q&As section after 2 questions
  useEffect(() => {
    if (previousQAs.length >= 2) {
      setIsExpanded(false);
    }
  }, [previousQAs]);

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

      const newAnswer = data.answer;
      setAnswer(newAnswer);

      // Add the current Q&A to previous ones and save
      const newQAs = [...previousQAs, { question, answer: newAnswer }];
      setPreviousQAs(newQAs);
      saveQAs(newQAs);

      setQuestion(''); // Clear the input after successful answer
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Ask Me Anything</h2>
          <p className="text-sm text-gray-600">
            I've watched the entire video and can answer any specific questions you have!
            {previousQAs.length > 0 && (
              <span className="block mt-1 text-primary">
                {previousQAs.length} questions answered and saved
              </span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any question about the video content..."
            className="w-full p-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={3}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 bottom-2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </div>
      </form>

      {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      {answer && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Answer:</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        </div>
      )}

      {previousQAs.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Previous Questions
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Previous Questions ({previousQAs.length})
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-4 max-h-[400px] overflow-y-auto">
              {previousQAs.map((qa, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm text-gray-900">Q: {qa.question}</p>
                  <p className="mt-2 text-sm text-gray-700">A: {qa.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
