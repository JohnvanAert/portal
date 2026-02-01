import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userData = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: { organization: true }
  });

  if (!userData) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Мой профиль</h1>
        <p className="text-slate-500 font-medium">Управление личными данными и информацией о компании</p>
      </div>

      <ProfileForm userData={userData} />
    </div>
  );
}