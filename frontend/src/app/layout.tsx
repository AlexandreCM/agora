import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { SessionProvider } from "@/components/session-provider";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora",
  description: "Prototype feed for Agora reports",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body>
        <SessionProvider user={user}>
          <AppHeader />
          <main className="container main-content">{children}</main>
          <footer className="site-footer">
            <div className="container">Prototype MVP · Agora</div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
