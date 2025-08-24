import { useEffect, useState } from "react";

// Hook for managing screen dimensions and overflow
export const useScreenDimensions = (initScreenHeight: number) => {
  const [screenHeight, setScreenHeight] = useState(initScreenHeight);
  const [isOverFlow, setIsOverFlow] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };

    if (typeof window !== "undefined") {
      setScreenHeight(window.innerHeight);
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const updateOverflow = (chatBoxHeight: number) => {
    if (chatBoxHeight > screenHeight - 210) {
      setIsOverFlow(true);
    } else if (chatBoxHeight < screenHeight - 210) {
      setIsOverFlow(false);
    }
  };

  return {
    screenHeight,
    isOverFlow,
    updateOverflow,
  };
};