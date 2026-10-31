import { requireStaff } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";

export default async function BackendLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-screen">
      <Navbar user={{ name: user.name, email: user.email, role: user.role }} />
      <main>{children}</main>
    </div>
  );
}
