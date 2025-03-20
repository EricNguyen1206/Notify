"use client";

import { z } from "zod";
import AuthForm from "@/components/AuthForm";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      const response = await api.post("/auth/login", values);
      localStorage.setItem("token", response.data.token); // Store token
      router.push("/topics"); // Redirect to home page
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <AuthForm schema={loginSchema} onSubmit={handleLogin} buttonText="Login" />
      <p className="text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-500 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
