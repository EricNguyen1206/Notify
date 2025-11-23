"use client";

import { useScreenWidth } from "@/hooks/useScreenWidth";
import { useEffect, useState } from "react";

type Props = {
  children?: React.ReactNode;
};

const ScreenProvider = ({ children }: Props) => {
  const screen = useScreenWidth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, always render children to prevent hydration mismatch
  if (!isClient) {
    return <>{children}</>;
  }

  if (screen < 700) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-primary-purple">
        <p className="text-xl font-bold">App is not available on mobile</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ScreenProvider;
