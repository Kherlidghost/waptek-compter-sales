import Link from "next/link";

type WaptekBrandProps = {
  compact?: boolean;
  theme?: "light" | "dark";
  className?: string;
};

export function WaptekBrand({ compact = false, theme = "light", className = "" }: WaptekBrandProps) {
  const isDark = theme === "dark";

  return (
    <Link
      href="/"
      className={`flex shrink-0 items-center gap-3 focus-visible:outline-primary-400 ${className}`}
      aria-label="WAPTEK COMPUTER SERVICES — home"
    >
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black shadow-lg ${
          isDark
            ? "bg-accent-400 text-primary-950 shadow-accent-950/20"
            : "bg-gradient-to-br from-primary-700 to-accent-600 text-white shadow-primary-950/20"
        }`}
        aria-hidden="true"
      >
        <span className="absolute inset-0 rounded-2xl bg-white/10" />
        <span className="relative">WCS</span>
      </span>

      {!compact ? (
        <span className={`hidden leading-tight sm:block ${isDark ? "text-white" : "text-slate-950"}`}>
          <span className="block text-base font-black tracking-[0.08em]">WAPTEK</span>
          <span className={`block text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? "text-slate-300" : "text-slate-500"}`}>
            COMPUTER SERVICES
          </span>
        </span>
      ) : null}
    </Link>
  );
}
