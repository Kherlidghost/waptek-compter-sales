import type { ReactNode } from "react";

type DesignSurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function DesignSurface({ children, className = "" }: DesignSurfaceProps) {
  return <div className={`reference-shell p-4 sm:p-5 ${className}`}>{children}</div>;
}
