import { Avatar } from "@/components/ui/avatar";
import { fmtDateTime } from "@/lib/format";

type Entry = { id: string; message: string; createdAt: Date; user: { name: string } | null };

/** Read-only activity trail (Odoo "chatter"). */
export function Chatter({ entries }: { entries: Entry[] }) {
  return (
    <div className="rounded-sm border bg-card">
      <div className="border-b px-4 py-2.5 text-[13px] font-semibold">Activity</div>
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="max-h-[560px] divide-y overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="flex gap-2.5 px-4 py-2.5">
              <Avatar name={e.user?.name ?? "System"} className="size-7" />
              <div className="min-w-0">
                <p className="text-xs">
                  <span className="font-semibold">{e.user?.name ?? "System"}</span>{" "}
                  <span className="text-muted-foreground">· {fmtDateTime(e.createdAt)}</span>
                </p>
                <p className="text-[13px] text-foreground/90">{e.message}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
