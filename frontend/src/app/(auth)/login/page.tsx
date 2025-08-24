import Image from "next/image";

import GithubLoginButton from "@/components/atoms/GithubLoginButton";
import LoginEmailForm from "@/components/molecules/LoginEmailForm";

const LoginPage = () => {
  return (
    <div className="bg-cover min-h-screen bg-[url('/images/login.png')] flex flex-col items-center justify-center p-chat-outer">
      <div className="text-white bg-secondary-gray rounded-chat flex flex-wrap justify-center gap-10 md:gap-[80px] m-5 border border-chat-border">
        <LoginEmailForm />
        <div className="p-chat-outer flex flex-col items-center gap-5">
          <Image
            className="rounded-chat"
            style={{ width: "80%", height: "auto" }}
            priority
            src="/images/qr-code.png"
            width="180"
            height="0"
            alt="icon"
          />
          <div className="flex flex-col items-center gap-1">
            <h1 className="font-medium text-xl text-center text-white">
              Log in with QR Code
            </h1>
            <p className="text-gray-400 text-sm max-w-[200px] text-center font-normal">
              Scan this with the Discord mobile app to log in instantly.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-[100%]">
            <GithubLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
