export function DashboardLoading({ title = "Loading dashboard" }: { title?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-9 w-full max-w-md rounded bg-slate-200" />
          <p className="sr-only">{title}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-5 grid gap-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-12 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
