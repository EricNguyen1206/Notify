import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notify | Register",
  description: "Developed by EricNguyen",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
