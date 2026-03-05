type DbStatus = "connected" | "disconnected" | "stale";

interface DbStatusBannerProps {
  status: DbStatus;
  dbPath?: string;
}

const config = {
  disconnected: {
    wrapper: "bg-red-950 text-red-300",
    dot: "bg-red-400",
    message: "Cannot reach database — run `npx ruflo doctor` from the repo root",
  },
  stale: {
    wrapper: "bg-amber-950 text-amber-300",
    dot: "bg-amber-400",
    message: "No db updates in 30s — is Ruflo running? Try `npx ruflo daemon start`",
  },
} satisfies Partial<Record<DbStatus, { wrapper: string; dot: string; message: string }>>;

export function DbStatusBanner({ status }: DbStatusBannerProps) {
  if (status === "connected") return null;

  const { wrapper, dot, message } = config[status];

  return (
    <div className={`h-8 w-full flex items-center justify-center gap-2 text-xs font-medium ${wrapper}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      {message}
    </div>
  );
}
