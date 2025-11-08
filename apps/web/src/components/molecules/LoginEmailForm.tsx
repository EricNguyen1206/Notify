"use client";

import { usePostAuthLogin } from "@/services/endpoints/auth/auth";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const LoginEmailForm = () => {
  const [email, setEmail] = useState("admin@notify.com");
  const [password, setPassword] = useState("123456");
  const router = useRouter();
  const { setUser, setIsAuthenticated, setToken } = useAuthStore();

  const loginMutation = usePostAuthLogin({
    mutation: {
      onSuccess: (res) => {
        const data = res.data;
        // Assuming the response contains a token and user data
        if (!data || !data.token || !data.user) {
          toast.error("Invalid login response");
          return;
        }
        const { token, user } = data;

        if (token && user) {
          // Store token in cookie
          document.cookie = `token=${token}; path=/; max-age=${60 * 60}; samesite=lax${process.env.NODE_ENV === "production" ? "; secure" : ""}`;

          // Store user data in cookie (as JSON string, encode to avoid issues)
          const userCookie = encodeURIComponent(
            JSON.stringify({
              id: user.id,
              email: user.email,
              username: user.username || "",
            })
          );
          document.cookie = `user=${userCookie}; path=/; max-age=${60 * 60}; samesite=lax${process.env.NODE_ENV === "production" ? "; secure" : ""}`;

          // Update Zustand state
          setToken(token);
          setUser({
            id: user.id!,
            email: user.email!,
            username: user.username || "",
          });
          setIsAuthenticated(true);

          toast.success("Login successfully");
          router.push("/messages");
        }
      },
      onError: (error) => {
        toast.error("An error occurred during login");
        console.error("Login error:", error);
      },
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <form className="flex flex-col gap-chat-gutter w-[100%] md:w-auto p-chat-outer" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 items-center">
        <h1 className="text-xl font-medium text-white">Welcome back!</h1>
        <p className="text-sm text-gray-400 font-normal">We're so excited to see you again!</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-400">EMAIL OR PHONE NUMBER</p>
        <input
          className="w-auto md:w-[450px] outline-none p-3 bg-primary-black text-white rounded-chat border border-chat-border focus:border-chat-primary transition-colors"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-400">PASSWORD</p>
        <input
          className="w-auto md:w-[450px] outline-none p-3 bg-primary-black text-white rounded-chat border border-chat-border focus:border-chat-primary transition-colors"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Link href={"/forgot-password"}>
        <p className="text-xs text-chat-accent hover:underline hover:underline-offset-1 font-normal">
          Forgot your password?
        </p>
      </Link>
      <button
        type="submit"
        className="bg-chat-primary text-white py-3 rounded-chat font-medium hover:bg-chat-secondary transition-colors disabled:opacity-50"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Loading..." : "Log In"}
      </button>
      <div className="text-xs flex items-center gap-1 font-normal">
        <p className="text-gray-400">Need an account?</p>
        <Link href={"/register"}>
          <p className="text-chat-accent hover:underline hover:underline-offset-1">Register</p>
        </Link>
      </div>
    </form>
  );
};

export default LoginEmailForm;
