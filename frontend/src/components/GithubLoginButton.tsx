'use client'

// import { loginAction } from "@/utils/actions/user";
// import { useRouter } from "next/navigation";
import { Provider } from "@supabase/supabase-js";
import { useTransition } from "react";
import { FaGithub } from "react-icons/fa";
// import { toast } from "react-toastify";
import { handleGithubLogin } from "@/lib/action";

export default function GithubLoginButton() {
  // const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClickLoginButton = (provider: Provider) => {
    startTransition(async () => {
      // const { errorMessage, url } = await loginAction(provider);
      // if (!errorMessage && url) {
      //   router.push(url);
      // } else {
      //   toast.error(errorMessage);
      // }
      await handleGithubLogin()
    });
  };
  return (
    <button
      className="bg-white text-black font-bold rounded-md px-6 py-2 w-[100%] flex items-center gap-3 hover:text-primary-purple"
      onClick={() => handleClickLoginButton("github")}
      type="button"
    >
      <FaGithub size={25} />
      <p>{isPending ? "Logging in..." : "Login with GitHub"}</p>
    </button>
  );
}