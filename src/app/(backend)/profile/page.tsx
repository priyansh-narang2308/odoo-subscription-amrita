import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { ControlPanel } from "@/components/odoo/control-panel";
import { ProfileForm } from "@/components/forms/profile-form";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireStaff();
  return (
    <>
      <ControlPanel breadcrumbs={[{ label: "My Profile" }]} />
      <div className="p-4">
        <div className="o-sheet">
          <ProfileForm name={user.name} email={user.email} role={ROLE_LABEL[user.role]} />
        </div>
      </div>
    </>
  );
}
