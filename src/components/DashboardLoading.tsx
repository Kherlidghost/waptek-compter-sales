export function DashboardLoading({ title = "Loading dashboard" }: { title?: string }) {
  return (
    <div className="min-h-screen dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="skeleton h-40 rounded-3xl" />
        <div className="skeleton h-14 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-40 rounded-3xl" />
          ))}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
        <p className="sr-only">{title}</p>
      </div>
    </div>
  );
}
