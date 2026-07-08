"use client";

import { useEffect, useState } from "react";

export function SignedOutToast({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;

    setVisible(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("signed_out");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

    const timeout = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [show]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 top-4 z-50 max-w-sm rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-lg"
      role="status"
    >
      You have been signed out successfully.
    </div>
  );
}
