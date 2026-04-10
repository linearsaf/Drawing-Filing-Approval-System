"use client";

import { createContext, ReactNode, startTransition, useContext } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { User } from "@/lib/types";

type AuthSession = typeof authClient.$Infer.Session;

interface AppContextValue {
  ready: boolean;
  session: AuthSession | null;
  currentUser: User | null;
  logout: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizeCurrentUser(session: AuthSession | null): User | null {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image:
      "image" in session.user && typeof session.user.image === "string"
        ? session.user.image
        : null,
    username:
      ("username" in session.user && typeof session.user.username === "string"
        ? session.user.username
        : null) ??
      ("displayUsername" in session.user && typeof session.user.displayUsername === "string"
        ? session.user.displayUsername
        : null) ??
      session.user.email,
    role:
      "role" in session.user && typeof session.user.role === "string"
        ? (session.user.role as User["role"])
        : "CONSUMER",
    isActive:
      "isActive" in session.user && typeof session.user.isActive === "boolean"
        ? session.user.isActive
        : true,
    createdAt:
      "createdAt" in session.user && typeof session.user.createdAt === "string"
        ? session.user.createdAt
        : "",
    updatedAt:
      "updatedAt" in session.user && typeof session.user.updatedAt === "string"
        ? session.user.updatedAt
        : ""
  };
}

export function DemoAppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isPending, refetch } = authClient.useSession();
  const currentUser = normalizeCurrentUser(data ?? null);

  const logout = async () => {
    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });

    await authClient.signOut();
  };

  return (
    <AppContext.Provider
      value={{
        ready: !isPending,
        session: data ?? null,
        currentUser,
        logout,
        refetchSession: refetch
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useDemoApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useDemoApp must be used within DemoAppProvider.");
  }

  return context;
}
