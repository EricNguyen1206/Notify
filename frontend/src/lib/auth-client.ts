"use client";

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

export const signIn = (provider: string, options?: any) => {
  return nextAuthSignIn(provider, options);
};

export const signOut = (options?: any) => {
  return nextAuthSignOut(options);
};

export const githubLogin = () => {
  return signIn("github", { callbackUrl: "/dashboard/friends" });
};

export const credentialsLogin = (email: string, password: string) => {
  return signIn("credentials", {
    email,
    password,
    callbackUrl: "/dashboard/friends",
  });
};

