"use client";

import React, { createContext, useContext } from "react";
import { ClerkProvider } from "@clerk/nextjs";

export const rawClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
export const hasValidClerkKey =
  rawClerkKey.startsWith("pk_") &&
  !rawClerkKey.includes("Y2xlcmsuZXhhbXBsZS5jb20k") &&
  !rawClerkKey.includes("example.com");

export interface MockUser {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  primaryEmailAddress: { emailAddress: string };
  imageUrl: string;
}

export const mockUser: MockUser = {
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
  user: MockUser | null;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: true,
  isLoaded: true,
  userId: mockUser.id,
  user: mockUser,
});

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  if (hasValidClerkKey) {
    return <ClerkProvider publishableKey={rawClerkKey}>{children}</ClerkProvider>;
  }

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: true,
        isLoaded: true,
        userId: mockUser.id,
        user: mockUser,
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
    signOut: () => console.log("Demo sign out"),
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
