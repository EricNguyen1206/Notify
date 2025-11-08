import LoginEmailForm from "@/components/molecules/LoginEmailForm";

const LoginPage = () => {
  return (
    <div className="bg-cover min-h-screen bg-[url('/images/login.png')] flex flex-col items-center justify-center p-chat-outer">
      <div className="text-white bg-secondary-gray rounded-chat flex flex-wrap justify-center gap-10 md:gap-[80px] m-5 border border-chat-border">
        <LoginEmailForm />
      </div>
    </div>
  );
};

export default LoginPage;
