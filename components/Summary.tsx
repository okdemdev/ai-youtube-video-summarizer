import { VideoMetadata } from '@/lib/youtube';

interface SummaryProps {
  content: string;
  isLoading?: boolean;
  metadata?: VideoMetadata;
}

export default function Summary({ content, isLoading, metadata }: SummaryProps) {
  if (!content && !isLoading && !metadata) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {metadata && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative">
            <img 
              src={metadata.thumbnailUrl} 
              alt={metadata.title}
              className="w-full h-[300px] object-cover"
            />
            <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-sm">
              {metadata.duration}
            </div>
          </div>
          
          <div className="p-6">
            <h1 className="text-xl font-bold mb-2">{metadata.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span>{metadata.channelTitle}</span>
              <span>•</span>
              <span>{metadata.publishedAt}</span>
              <span>•</span>
              <span>{parseInt(metadata.viewCount).toLocaleString()} views</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Summary</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-[95%]"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-[90%]"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-[97%]"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-[85%]"></div>
          </div>
        ) : content ? (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : null}
      </div>
    </div>
  );
}
