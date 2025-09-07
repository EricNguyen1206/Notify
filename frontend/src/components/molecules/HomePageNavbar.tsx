import { HomeNavLinks } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const HomePageNavbar = () => {
  return (
    <div className="bg-chat-primary text-white flex flex-wrap gap-5 justify-around items-center py-4 px-chat-outer border-b border-chat-border">
      <Link href={"/"}>
        <Image className="w-[120px] h-auto" src="/images/nav-icon.svg" width="0" height="0" alt="icon" />
      </Link>
      <div className="flex flex-wrap justify-center gap-3 md:gap-8 font-medium">
        {HomeNavLinks.map((link) => {
          return (
            <Link key={link.name} href={link.url}>
              <p className="hover:underline hover:underline-offset-1 transition-all">{link.name}</p>
            </Link>
          );
        })}
      </div>
      <Link href={"/login"}>
        <div
          className="bg-white text-sm text-black font-medium px-4 py-2 rounded-chat
                        hover:text-chat-primary hover:shadow-2xl transition-colors"
        >
          Login
        </div>
      </Link>
    </div>
  );
};

export default HomePageNavbar;
