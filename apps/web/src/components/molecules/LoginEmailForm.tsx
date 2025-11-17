"use client";

import { useSigninMutation } from "@/services/api/auth";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const LoginEmailForm = () => {
  const [email, setEmail] = useState("admin@notify.com");
  const [password, setPassword] = useState("123456");
  const router = useRouter();
  const queryClient = useQueryClient();

  const signinMutation = useSigninMutation({
    onSuccess: () => {
      // Invalidate and refetch user query to get fresh user data
      queryClient.invalidateQueries({ queryKey: ["user", "current"] });
      
      toast.success("Sign in successfully");
      router.push("/messages");
    },
    onError: (error) => {
      toast.error("An error occurred during sign in");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signinMutation.mutate({ email, password });
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
        disabled={signinMutation.isPending}
      >
        {signinMutation.isPending ? "Loading..." : "Log In"}
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
