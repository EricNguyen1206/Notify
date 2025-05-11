import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { NextRequest } from "next/server";

// export default NextAuth(authConfig).auth;

export default function middleware(req: NextRequest) {
  const isLoggedIn = !!req.cookies.get("next-auth.session-token");
  console.log("TEST", isLoggedIn);
}

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next).*)"],
};