import { redirect } from "next/navigation";

import { AdminPageClient } from "@/components/admin-page-client";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/login?from=/admin");
  }

  return <AdminPageClient />;
}
