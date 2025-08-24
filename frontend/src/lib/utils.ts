import { ChannelType } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const HomeNavLinks = [
  {
    name: "Download",
    url: "/download",
  },
  {
    name: "Nitro",
    url: "/nitro",
  },
  {
    name: "Discover",
    url: "/discover",
  },
  {
    name: "Safety",
    url: "/safety",
  },
  {
    name: "Support",
    url: "/support",
  },
  {
    name: "Blog",
    url: "/blog",
  },
  {
    name: "Careers",
    url: "/careers",
  },
];

export const HomeFooterLinks = [
  {
    name: "Product",
    links: [
      {
        name: "Download",
        url: "/Download",
      },
      {
        name: "Nitro",
        url: "/nitro",
      },
      {
        name: "Status",
        url: "/status",
      },
      {
        name: "App Directory",
        url: "/application-directory",
      },
      {
        name: "New Mobile Experience",
        url: "/mobile",
      },
    ],
  },
  {
    name: "Company",
    links: [
      {
        name: "About",
        url: "/about",
      },
      {
        name: "Jobs",
        url: "/jobs",
      },
      {
        name: "Brand",
        url: "/brands",
      },
      {
        name: "Newsroom",
        url: "/newsroom",
      },
      {
        name: "Fall Release",
        url: "/fallrelease",
      },
    ],
  },
  {
    name: "Resources",
    links: [
      {
        name: "College",
        url: "/colleges",
      },
      {
        name: "Support",
        url: "/support",
      },
      {
        name: "Safety",
        url: "/safety",
      },
      {
        name: "Blog",
        url: "/blog",
      },
      {
        name: "Feedback",
        url: "/feedback",
      },
      {
        name: "StreamKit",
        url: "/streamKit",
      },
      {
        name: "Creators",
        url: "/creators",
      },
      {
        name: "Community",
        url: "/community",
      },
      {
        name: "Developers",
        url: "/developers",
      },
      {
        name: "Gaming",
        url: "/gaming",
      },
      {
        name: "Official 3rd Party Merch",
        url: "https://discordmerch.com/?utm_source=shortlink&utm_lkey=z5bm6",
      },
    ],
  },
  {
    name: "Policies",
    links: [
      {
        name: "Terms",
        url: "/terms",
      },
      {
        name: "Privacy",
        url: "/privacy",
      },
      {
        name: "Cookie Settings",
        url: "/cookie-settings",
      },
      {
        name: "Guidelines",
        url: "/guidelines",
      },
      {
        name: "Acknowledgements",
        url: "/acknowledgements",
      },
      {
        name: "Licenses",
        url: "/licenses",
      },
      {
        name: "Company Information",
        url: "/company-information",
      },
    ],
  },
];

export const ApplicationFileType: string[] = [
  "docx",
  "xlsx",
  "pdf",
  "vnd.openxmlformats-officedocument.wordprocessingml.document",
  "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const ChannelsData: ChannelType[] = [
  {
    id: "1",
    name: "chat-room-1",
    
    type: "text",
  },
  {
    id: "2",
    name: "chat-room-2",
    
    type: "text",
  },
  {
    id: "3",
    name: "study-chat-1",
    type: "text",
  },
  {
    id: "4",
    name: "study-chat-2",
    type: "text",
  },
  {
    id: "5",
    name: "coding-challenge-1",
    type: "text",
  },
  {
    id: "6",
    name: "coding-challenge-2",
    type: "voice",
  },
];
