"use client";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-slate-600 [&>svg]:size-8">{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
