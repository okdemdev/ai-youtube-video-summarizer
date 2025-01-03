import { useState, useEffect } from 'react';
import { VideoMetadata } from '@/lib/youtube';
import { BookmarkPlus, BookmarkCheck, Share2 } from 'lucide-react';

interface SummaryProps {
  content: string;
  isLoading?: boolean;
  metadata?: VideoMetadata;
  transcript?: string;
}

export default function Summary({ content, isLoading, metadata, transcript }: SummaryProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (metadata?.videoId) {
      const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
      const isAlreadySaved = savedVideos.some((video: any) => video.id === metadata.videoId);
      setIsSaved(isAlreadySaved);
    }
  }, [metadata?.videoId]);

  const handleSave = () => {
    if (!metadata || !content || !transcript) return;

    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');

    if (savedVideos.some((video: any) => video.id === metadata.videoId)) {
      return;
    }

    const videoData = {
      id: metadata.videoId,
      metadata,
      summary: content,
      transcript,
      qas: [],
      savedAt: Date.now(),
    };

    const updatedVideos = [...savedVideos, videoData];
    localStorage.setItem('savedVideos', JSON.stringify(updatedVideos));
    setIsSaved(true);
  };

  const handleShare = async () => {
    if (!metadata) return;

    try {
      await navigator.share({
        title: metadata.title,
        text: 'Check out this video summary!',
        url: `https://www.youtube.com/watch?v=${metadata.videoId}`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!content && !isLoading && !metadata) return null;

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-[60vh]">
        <div className="w-full max-w-2xl space-y-8 animate-pulse">
          {/* Video Card Skeleton */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-[300px] bg-gray-200"></div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="h-7 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="flex gap-3">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="w-28 h-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card Skeleton */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-7 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-[95%]"></div>
              <div className="h-4 bg-gray-200 rounded w-[90%]"></div>
              <div className="h-4 bg-gray-200 rounded w-[97%]"></div>
              <div className="h-4 bg-gray-200 rounded w-[85%]"></div>
              <div className="h-4 bg-gray-200 rounded w-[92%]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {metadata && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative">
            <img
              src={metadata.thumbnailUrl}
              alt={metadata.title}
              className="w-full h-[200px] sm:h-[300px] object-cover"
            />
            <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-sm">
              {metadata.duration}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold mb-2">{metadata.title}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                  <span>{metadata.channelTitle}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{metadata.publishedAt}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{parseInt(metadata.viewCount).toLocaleString()} views</span>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleShare}
                  className="flex-1 sm:flex-initial p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Share video"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaved}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isSaved
                      ? 'bg-green-100 text-green-600'
                      : 'bg-primary text-white hover:bg-primary-hover'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-5 h-5" />
                      <span className="sm:hidden">Saved</span>
                      <span className="hidden sm:inline">Saved to Library</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-5 h-5" />
                      <span className="sm:hidden">Save</span>
                      <span className="hidden sm:inline">Save to Library</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isSaved && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <div className="text-blue-500 mt-1">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-700 mb-1">Save for Later Access</h3>
                  <p className="text-sm text-blue-600">
                    Save this video to your library to:
                    <span className="block mt-1">
                      • Keep the AI-generated summary
                      <br />
                      • Access the full video transcript
                      <br />
                      • Save all Q&As for future reference
                      <br />• Ask new questions anytime
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">Summary</h2>
        <div>
          {content && (
            <div className="space-y-6">
              {content.split('\n\n').map((section, index) => {
                // Check if this is a section header
                if (
                  section.includes('OVERVIEW') ||
                  section.includes('MAIN TAKEAWAYS') ||
                  section.includes('VALUABLE INSIGHTS') ||
                  section.includes('NOTABLE MOMENTS')
                ) {
                  return (
                    <div key={index} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {section.split('\n')[0]}
                      </h3>
                      <div className="pl-1">
                        {section
                          .split('\n')
                          .slice(1)
                          .map((line, i) => (
                            <p key={i} className="text-gray-700 leading-relaxed">
                              {line}
                            </p>
                          ))}
                      </div>
                    </div>
                  );
                }

                // For bullet points
                if (section.includes('•')) {
                  return (
                    <div key={index} className="space-y-2 pl-1">
                      {section.split('\n').map((line, i) => (
                        <p key={i} className="text-gray-700 leading-relaxed flex items-start gap-2">
                          {line}
                        </p>
                      ))}
                    </div>
                  );
                }

                // For regular paragraphs
                return (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {section}
                  </p>
                );
              })}
            </div>
          )}

          {isSaved && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5" />
                This video and all its content are saved to your library
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
