import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

interface AgentAvatarProps {
  agentId: string;
  role: string;
  size?: Size;
  className?: string;
}

const palette = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-orange-500",
];

const sizeStyles: Record<Size, string> = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

function hashRole(role: string): number {
  let sum = 0;
  for (let i = 0; i < role.length; i++) {
    sum += role.charCodeAt(i);
  }
  return sum % palette.length;
}

export function AgentAvatar({ agentId, role, size = "md", className }: AgentAvatarProps) {
  const color = palette[hashRole(role)];
  const initials = role.slice(0, 2).toUpperCase();

  return (
    <div
      title={agentId}
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white select-none",
        color,
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
