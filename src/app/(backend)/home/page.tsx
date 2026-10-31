import Link from "next/link";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { appsFor } from "@/lib/apps";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const user = await requireStaff();
  const apps = appsFor(user.role);
  return (
    <div className="min-h-[calc(100vh-46px)] bg-[radial-gradient(ellipse_at_top,#f6eef4,#eef1f5_60%)] px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <p className="mb-10 text-center text-[13px] text-muted-foreground">
          Welcome back, <span className="font-semibold text-foreground">{user.name.split(" ")[0]}</span>
        </p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-10 sm:grid-cols-4 md:grid-cols-6">
          {apps.map((app) => (
            <Link key={app.id} href={app.href} className="group flex flex-col items-center gap-2 text-center" title={app.description}>
              <span
                className={`flex size-[70px] items-center justify-center rounded-xl bg-gradient-to-br ${app.color} shadow-md transition-transform group-hover:-translate-y-0.5 group-hover:shadow-lg`}
              >
                <app.icon className="size-8 text-white" strokeWidth={1.75} />
              </span>
              <span className="text-[13px] font-medium text-foreground/90">{app.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
