export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-[53px] border-b bg-card" />
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-9 rounded-sm bg-muted" />)}
      </div>
    </div>
  );
}
