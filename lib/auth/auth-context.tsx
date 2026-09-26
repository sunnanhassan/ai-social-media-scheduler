"use client";

import React, { createContext, useContext } from "react";
import { ClerkProvider, useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/nextjs";

export const rawClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
export const hasValidClerkKey =
  rawClerkKey.startsWith("pk_") &&
  !rawClerkKey.includes("Y2xlcmsuZXhhbXBsZS5jb20k") &&
  !rawClerkKey.includes("example.com");

export interface AppUserType {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryEmailAddress: { emailAddress: string };
  imageUrl: string;
}

export const mockUser: AppUserType = {
  id: "user_demo_101",
  fullName: "Sunnan Hassan",
  firstName: "Sunnan",
  lastName: "Hassan",
  primaryEmailAddress: { emailAddress: "sannanhassan10@gmail.com" },
  imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
};

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  user: AppUserType | null;
  getToken: (options?: { template?: string }) => Promise<string | null>;
  signOut: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: true,
  isLoaded: true,
  userId: mockUser.id,
  user: mockUser,
  getToken: async () => null,
  signOut: () => {},
});

function ClerkBridge({ children }: { children: React.ReactNode }) {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();

  const user: AppUserType | null = clerkUser.user
    ? {
        id: clerkUser.user.id,
        fullName: clerkUser.user.fullName || clerkUser.user.username || "User",
        firstName: clerkUser.user.firstName || "User",
        lastName: clerkUser.user.lastName || "",
        primaryEmailAddress: {
          emailAddress: clerkUser.user.primaryEmailAddress?.emailAddress || "",
        },
        imageUrl: clerkUser.user.imageUrl || "",
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: Boolean(clerkAuth.isSignedIn),
        isLoaded: Boolean(clerkAuth.isLoaded && clerkUser.isLoaded),
        userId: clerkAuth.userId || null,
        user,
        getToken: (options) => clerkAuth.getToken(options),
        signOut: () => clerkAuth.signOut(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  if (hasValidClerkKey) {
    return (
      <ClerkProvider publishableKey={rawClerkKey}>
        <ClerkBridge>{children}</ClerkBridge>
      </ClerkProvider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: true,
        isLoaded: true,
        userId: mockUser.id,
        user: mockUser,
        getToken: async () => null,
        signOut: () => console.log("Demo sign out"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  return {
    isSignedIn: context.isSignedIn,
    userId: context.userId,
    isLoaded: context.isLoaded,
    getToken: context.getToken,
    signOut: context.signOut,
  };
}

export function useAppUser() {
  const context = useContext(AuthContext);
  return {
    isSignedIn: context.isSignedIn,
    isLoaded: context.isLoaded,
    user: context.user,
  };
}

export function useAppSubscription() {
  return {
    data: {
      subscriptionItems: [{ plan: { slug: "pro" } }],
    },
    isLoading: false,
  };
}

export { useAppAuth as useAuth, useAppUser as useUser, useAppSubscription as useSubscription };
