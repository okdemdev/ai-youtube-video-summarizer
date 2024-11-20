interface SummaryProps {
  content: string;
}

export default function Summary({ content }: SummaryProps) {
  if (!content) return null;

  return (
    <div className="p-6 bg-muted rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Summary</h2>
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
