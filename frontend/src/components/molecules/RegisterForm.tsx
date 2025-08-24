"use client";

import { usePostAuthRegister } from "@/services/endpoints/auth/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    adminCode: "",
  });
  const router = useRouter();

  const registerMutation = usePostAuthRegister({
    mutation: {
      onSuccess: (data) => {
        // Registration successful, redirect to login
        toast.success("Registration successful! Please log in with your credentials.");
        router.push("/login");
      },
      onError: (error) => {
        toast.error("An error occurred during registration");
        console.error("Registration error:", error);
      },
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validate required fields
    if (!formData.email || !formData.password || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    // Prepare registration data
    const registrationData = {
      email: formData.email,
      password: formData.password,
      username: formData.name,
      ...(formData.adminCode && { adminCode: formData.adminCode }),
    };

    registerMutation.mutate({ data: registrationData });
  };

  return (
    <form className="flex flex-col gap-chat-gutter w-[100%] md:w-auto p-chat-outer" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 items-center">
        <h1 className="text-xl font-medium text-white">Create an account</h1>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-400">EMAIL</p>
        <input
          className="w-auto md:w-[450px] outline-none p-3 bg-primary-black text-white rounded-chat border border-chat-border focus:border-chat-primary transition-colors"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-400">NAME</p>
        <input
          className="w-auto md:w-[450px] outline-none p-3 bg-primary-black text-white rounded-chat border border-chat-border focus:border-chat-primary transition-colors"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-400">PASSWORD</p>
        <input
          className="w-auto md:w-[450px] outline-none p-3 bg-primary-black text-white rounded-chat border border-chat-border focus:border-chat-primary transition-colors"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>
      <button
        type="submit"
        className="bg-chat-primary text-white py-3 rounded-chat font-medium hover:bg-chat-secondary transition-colors disabled:opacity-50"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? "Loading..." : "Continue"}
      </button>
      <div className="text-xs flex items-center gap-1 font-normal">
        <Link href={"/login"}>
          <p className="text-chat-accent hover:underline hover:underline-offset-1">Already have an account?</p>
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;
