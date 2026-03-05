import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Panel({ children, title, className }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-slate-900 border border-slate-800 rounded-xl",
        className
      )}
    >
      {title && (
        <div className="px-4 py-3 border-b border-slate-800">
          <span className="text-sm font-medium text-slate-200">{title}</span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
