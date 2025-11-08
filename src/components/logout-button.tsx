"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/components/session-provider";

export function LogoutButton() {
  const router = useRouter();
  const { setUser } = useSession();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.refresh();
      router.push("/");
    });
  };

  return (
    <button className="secondary-button" type="button" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
