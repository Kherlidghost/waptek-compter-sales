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
      className={`flex shrink-0 items-center gap-3 focus-visible:outline-emerald-600 ${className}`}
      aria-label="WAPTEK COMPUTER SERVICES — home"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black shadow-lg ${
          isDark
            ? "bg-emerald-400 text-slate-950 shadow-emerald-950/20"
            : "bg-slate-950 text-emerald-300 shadow-slate-950/20"
        }`}
        aria-hidden="true"
      >
        WCS
      </span>

      {!compact ? (
        <span
          className={`hidden text-base font-black leading-tight tracking-tight sm:block ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          WAPTEK
          <br />
          <span className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-500"}`}>
            COMPUTER SERVICES
          </span>
        </span>
      ) : null}
    </Link>
  );
}
