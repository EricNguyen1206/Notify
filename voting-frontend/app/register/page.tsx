"use client";

import { z } from "zod";
import AuthForm from "@/components/AuthForm";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    try {
      await api.post("/auth/register", values);
      router.push("/login"); // Redirect to login page
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <AuthForm schema={registerSchema} onSubmit={handleRegister} buttonText="Register" />
      <p className="text-center mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/login" className="text-blue-500 hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
}
