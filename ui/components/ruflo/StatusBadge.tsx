import { cn } from "@/lib/utils";

type Status = "idle" | "running" | "completed" | "failed" | "waiting";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, { pill: string; dot: string }> = {
  running:   { pill: "bg-blue-500/10 text-blue-400",   dot: "bg-blue-400 animate-pulse" },
  completed: { pill: "bg-green-500/10 text-green-400", dot: "bg-green-400" },
  failed:    { pill: "bg-red-500/10 text-red-400",     dot: "bg-red-400" },
  idle:      { pill: "bg-slate-500/10 text-slate-400", dot: "bg-slate-400" },
  waiting:   { pill: "bg-amber-500/10 text-amber-400", dot: "bg-amber-400" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { pill, dot } = statusStyles[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        pill,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
