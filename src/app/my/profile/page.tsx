import { requirePortal } from "@/lib/auth";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "My Account" };

export default async function MyProfile() {
  const user = await requirePortal();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Account</h1>
      <Card className="p-6"><ProfileForm name={user.name} email={user.email} role="Portal Customer" /></Card>
    </div>
  );
}
