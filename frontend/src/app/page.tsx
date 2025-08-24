import { Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import HomePageFooter from "@/components/molecules/HomePageFooter";
import HomePageNavbar from "@/components/molecules/HomePageNavbar";

export default function Home() {
    return (
        <div className="min-h-screen">
            <HomePageNavbar />
            <div className="min-h-[500px] bg-chat-primary relative pt-[50px] md:pt-[100px] px-chat-outer">
                <div className="z-20 absolute left-0 right-0 ml-auto mr-auto flex flex-col items-center gap-5 px-4 md:px-0">
                    <h1 className="text-[30px] md:text-[50px] text-white font-medium">
                        IMAGINE A PLACE...
                    </h1>
                    <p className="text-white md:text-center max-w-[700px] font-normal">
                        ...where you can belong to a school club, a gaming group, or a
                        worldwide art community. Where just you and a handful of friends can
                        spend time together. A place that makes it easy to talk every day
                        and hang out more often.
                    </p>
                    <div className="flex flex-wrap gap-chat-gutter items-center">
                        <Link href={"/download"}>
                            <div
                                className="text-primary-black bg-white flex justify-center items-center gap-3 px-6 py-3 rounded-chat
                              hover:text-chat-primary hover:shadow-2xl transition-colors font-medium"
                            >
                                <Download />
                                <p className="text-base">Download for Windows</p>
                            </div>
                        </Link>
                        <Link href={"/login"}>
                            <div
                                className="bg-primary-black text-white flex justify-center items-center gap-3 px-6 py-3 rounded-chat
                              hover:bg-secondary-gray hover:shadow-2xl transition-colors font-medium"
                            >
                                <p className="text-base">
                                    Open Discord in your browser
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
                <Image
                    className="z-10 absolute bottom-0 left-[-100px] md:left-0 w-[500px] h-auto"
                    src="/images/homepage-hero-1.svg"
                    width="0"
                    height="0"
                    alt="hero1"
                />
                <Image
                    className="z-10 hidden xl:block absolute bottom-0 right-0 w-[500px] h-auto"
                    src="/images/homepage-hero-2.svg"
                    width="0"
                    height="0"
                    alt="hero2"
                />
            </div>
            <div className="bg-background flex flex-wrap justify-center md:gap-[150px] py-[100px] px-chat-outer">
                <Image
                    className="w-[500px] h-auto"
                    src="/images/homepage-hero-3.svg"
                    width="0"
                    height="0"
                    alt="hero3"
                />
                <div className="max-w-[400px] flex flex-col gap-5">
                    <h1 className="text-foreground text-xl md:text-4xl font-medium">
                        Create an invite-only place where you belong
                    </h1>
                    <p className="text-foreground text-justify md:text-left font-normal">
                        Discord servers are organized into topic-based channels where you
                        can collaborate, share, and just talk about your day without
                        clogging up a group chat.
                    </p>
                </div>
            </div>
            <div className="bg-muted/20 flex flex-wrap justify-center md:gap-[150px] py-[100px] px-chat-outer">
                <div className="max-w-[400px] flex flex-col gap-5">
                    <h1 className="text-foreground text-xl md:text-4xl font-medium">
                        Where hanging out is easy
                    </h1>
                    <p className="text-foreground text-justify md:text-left font-normal">
                        Grab a seat in a voice channel when you’re free. Friends in your
                        server can see you’re around and instantly pop in to talk without
                        having to call.
                    </p>
                </div>
                <Image
                    className="w-[500px] h-auto"
                    src="/images/homepage-hero-4.svg"
                    width="0"
                    height="0"
                    alt="hero4"
                />
            </div>
            <div className="bg-background flex flex-wrap justify-center md:gap-[150px] py-[100px] px-chat-outer">
                <Image
                    className="w-[500px] h-auto"
                    src="/images/homepage-hero-5.svg"
                    width="0"
                    height="0"
                    alt="hero5"
                />
                <div className="max-w-[400px] flex flex-col gap-5">
                    <h1 className="text-foreground text-xl md:text-4xl font-medium">
                        From few to a fandom
                    </h1>
                    <p className="text-foreground text-justify md:text-left font-normal">
                        Get any community running with moderation tools and custom member
                        access. Give members special powers, set up private channels, and
                        more.
                    </p>
                </div>
            </div>
            <div className="bg-muted/20 flex flex-col items-center py-[100px] px-chat-outer">
                <div className="flex flex-col items-center gap-5">
                    <h1 className="text-foreground text-[40px] text-center font-medium">
                        RELIABLE TECH FOR STAYING CLOSE
                    </h1>
                    <p className="text-foreground md:text-xl text-center md:max-w-[1000px] font-normal">
                        Low-latency voice and video feels like you’re in the same room. Wave
                        hello over video, watch friends stream their games, or gather up and
                        have a drawing session with screen share.
                    </p>
                </div>
                <Image
                    className="w-[1000px] h-auto"
                    src="/images/homepage-hero-6.svg"
                    width="0"
                    height="0"
                    alt="hero6"
                />
                <div className="relative flex flex-col items-center gap-8">
                    <h1 className="absolute text-xl md:text-[35px] font-medium">
                        Ready to start your journey?
                    </h1>
                    <Image
                        className="w-[1000px] h-auto"
                        src="/images/homepage-hero-7.svg"
                        width="0"
                        height="0"
                        alt="hero7"
                    />
                    <Link href={"/download"}>
                        <div
                            className="bg-chat-primary text-white flex justify-center items-center gap-3 px-6 py-3 rounded-chat
                              hover:bg-chat-secondary hover:shadow-2xl transition-colors"
                        >
                            <Download />
                            <p className="font-medium text-base">Download for Windows</p>
                        </div>
                    </Link>
                </div>
            </div>
            <HomePageFooter />
        </div>
    );
}
