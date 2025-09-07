"use client";

// External libraries
import { useTransition } from "react";

// Third-party utilities
// (none)

// Types
import { Provider } from "@supabase/supabase-js";

// Icons
import { Github } from "lucide-react";

// Helpers, local modules
// (none)

export default function GithubLoginButton() {
  // State/hooks
  const [isPending, startTransition] = useTransition();

  // Event Handlers
  const handleClickLoginButton = (provider: Provider) => {
    startTransition(async () => {
      // const { errorMessage, url } = await loginAction(provider);
      // if (!errorMessage && url) {
      //   router.push(url);
      // } else {
      //   toast.error(errorMessage);
      // }
      // await handleGithubLogin()
    });
  };

  // Render
  return (
    <button
      className="bg-white text-black font-bold rounded-md px-6 py-2 w-[100%] flex items-center gap-3 hover:text-primary-purple"
      onClick={() => handleClickLoginButton("github")}
      type="button"
    >
      <Github size={25} />
      <p>{isPending ? "Logging in..." : "Login with GitHub"}</p>
    </button>
  );
}
