"use client";

import { useState, useEffect } from "react";
import WelcomePage from "@/components/WelcomePage";
import AppShell from "@/components/AppShell";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  avatarUrl?: string;
  bio?: string;
  isOnline?: boolean;
  theme?: string;
  showOnlineStatus?: boolean;
  profileVisibility?: string;
  parentalControls?: boolean;
  blockViolence?: boolean;
  blockAdult?: boolean;
  createdAt?: string;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold gradient-bg bg-clip-text text-transparent mb-4">zivv</div>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomePage onAuth={(u) => setUser(u)} />;
  }

  return <AppShell user={user} setUser={setUser} />;
}
