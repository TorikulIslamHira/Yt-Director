import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader user={user} />
      {children}
    </>
  );
}
