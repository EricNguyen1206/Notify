"use server";

import { auth, signIn, signOut } from "./auth";
import { createNewUser, getUserByEmail, loginByEmail } from "../utils/actions/api";
import { UserType } from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const handleRegister = async (prevState: any, form: FormData) => {
  try {
    const { email, name, password, adminCode, agree }: any =
      Object.fromEntries(form);

    if (agree === undefined) return { error: "Please agree terms & policy" };

    // const res = await getUserByEmail(email);
    // const { user } = res;
    // console.log("TEST", user);

    // if (user !== null) return { error: "Email is already exist" };

    if (adminCode !== "" && adminCode !== process.env.NEXT_ADMIN_CODE)
      return { error: "Admin code incorrect" };

    const newUser: UserType = {
      name: name,
      email: email,
      password: password,
      avatar: null,
      provider: "email",
      isAdmin: adminCode === process.env.NEXT_ADMIN_CODE ? true : false,
    };

    const res2 = await createNewUser(newUser);
    const { message } = res2;

    if (message !== "Create user successfully") {
      return { error: message };
    }

    return { message: "Register account successfully" };
  } catch (err: any) {
    console.log(err);

    throw err;
  }
};

export const handleEmailLogin = async (prevState: any, form: FormData) => {
  try {
    const { email, password }: any = Object.fromEntries(form);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    const data = await res.json();
    const { message } = data;

    if (message !== "Login successfully") {
      return { error: message };
    }
    
    return { message: "Login successfully" };
  } catch (err: any) {
    console.error("Login error:", err);
    if (err.message.includes("CredentialsSignin")) {
      return { error: "Invalid username or password" };
    }
    return { error: "An error occurred during login" };
  }
};

export const handleGithubLogin = async () => {
  await signIn("github");
};

export const getUserSession = async () => {
  const session = await auth();
  return session;
};

export const handleSignOut = async () => {
  await signOut();
};

export const handleLeaveServerAction = async () => {
  revalidatePath("/dashboard/friends");
  redirect("/dashboard/friends");
};