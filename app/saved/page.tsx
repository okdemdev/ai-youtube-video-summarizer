'use client';

import { useEffect, useState } from 'react';
import { Trash2, MessageCircle, Clock, Eye, Calendar, PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface SavedVideo {
  id: string;
  metadata: {
    title: string;
    thumbnailUrl: string;
    duration: string;
    channelTitle: string;
    viewCount: string;
    publishedAt: string;
  };
  summary: string;
  transcript: string;
  qas?: Array<{ question: string; answer: string }>;
  savedAt: number;
}

export default function SavedPage() {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
    const updatedVideos = videos.map((video: SavedVideo) => ({
      ...video,
      qas: video.qas || [],
    }));
    setSavedVideos(updatedVideos.sort((a: SavedVideo, b: SavedVideo) => b.savedAt - a.savedAt));
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved video?')) {
      const newVideos = savedVideos.filter((video) => video.id !== id);
      localStorage.setItem('savedVideos', JSON.stringify(newVideos));
      setSavedVideos(newVideos);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <main className="min-h-screen p-6 md:p-24 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold gradient-text">Your Saved Videos</h1>
          <div className="text-sm text-gray-600">
            {savedVideos.length} {savedVideos.length === 1 ? 'video' : 'videos'} saved
          </div>
        </div>

        {savedVideos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <div className="mb-4">
              <PlayCircle className="w-16 h-16 text-primary/20 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">Your saved videos will appear here</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Summarize a video
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {savedVideos.map((video) => (
              <div
                key={video.id}
                className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative md:w-72">
                    <Link href={`/?video=${video.id}`}>
                      <div className="relative aspect-video md:aspect-auto md:h-full">
                        <img
                          src={video.metadata.thumbnailUrl}
                          alt={video.metadata.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-sm">
                          {video.metadata.duration}
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <Link
                          href={`/?video=${video.id}`}
                          className="text-xl font-semibold hover:text-primary transition-colors line-clamp-2"
                        >
                          {video.metadata.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="font-medium">{video.metadata.channelTitle}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{parseInt(video.metadata.viewCount).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{video.metadata.publishedAt}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete saved video"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-gray-700 line-clamp-2 mb-4">{video.summary}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Saved {formatDate(video.savedAt)}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        {video.qas && video.qas.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedVideo(expandedVideo === video.id ? null : video.id)
                            }
                            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{video.qas.length} Q&As</span>
                          </button>
                        )}

                        <Link
                          href={`/?video=${video.id}`}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>

                    {expandedVideo === video.id && video.qas && video.qas.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <h3 className="font-semibold text-sm text-gray-900">
                          Previous Questions & Answers
                        </h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {video.qas.map((qa, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                            >
                              <p className="font-medium text-gray-900">Q: {qa.question}</p>
                              <p className="mt-1 text-gray-700">A: {qa.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
