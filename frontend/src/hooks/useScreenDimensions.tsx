import { useEffect, useState } from "react";

// Hook for managing screen dimensions and overflow
export const useScreenDimensions = (initScreenHeight: number) => {
  const [screenHeight, setScreenHeight] = useState(initScreenHeight);
  const [isOverFlow, setIsOverFlow] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };

    setScreenHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const updateOverflow = (chatBoxHeight: number) => {
    if (chatBoxHeight > screenHeight - 210) {
      setIsOverFlow(true);
    } else if (chatBoxHeight < screenHeight - 210) {
      setIsOverFlow(false);
    }
  };

  // Return consistent values during SSR
  if (!isClient) {
    return {
      screenHeight: initScreenHeight,
      isOverFlow: false,
      updateOverflow,
    };
  }

  return {
    screenHeight,
    isOverFlow,
    updateOverflow,
  };
};
