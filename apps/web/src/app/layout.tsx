import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/templates/QueryClientProvider";
import { ThemeProvider } from "@/components/templates/ThemeProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notify",
  description: "Developed by EricNguyen",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className="h-screen overflow-hidden">
        <div className="flex flex-col h-screen">
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ToastContainer position="bottom-left" theme="colored" />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </ThemeProvider>
          </QueryProvider>
        </div>
      </body>
    </html>
  );
}
