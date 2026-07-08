export function InAppNotice({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-lg">
      {message}
    </div>
  );
}
