import { ApplicationFileType, ConversationsData } from '@notify/shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatOnlineTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 60) {
    return `${diffMins}m`; // 5m, 45m
  } else if (diffHours < 24) {
    return `${diffHours}h`; // 3h, 20h
  } else if (diffDays < 30) {
    return `${diffDays}d`; // 1d, 12d
  } else if (diffMonths < 12) {
    return `${diffMonths}m`; // 1m, 2m, 11m
  } else {
    return `${diffYears}y`; // 1y, 2y
  }
};

export const formatMessageTime = (date: Date) => {
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) {
    return timeStr; // ví dụ: "14:35"
  } else if (isYesterday) {
    return `Hôm qua ${timeStr}`; // ví dụ: "Hôm qua 23:10"
  } else if (date.getFullYear() === now.getFullYear()) {
    return `${date.getDate()}/${date.getMonth() + 1} ${timeStr}`; // ví dụ: "22/9 09:15"
  } else {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${timeStr}`; // ví dụ: "15/12/2023 18:40"
  }
};

export const HomeNavLinks = [
  {
    name: 'Download',
    url: '/download',
  },
  {
    name: 'Nitro',
    url: '/nitro',
  },
  {
    name: 'Discover',
    url: '/discover',
  },
  {
    name: 'Safety',
    url: '/safety',
  },
  {
    name: 'Support',
    url: '/support',
  },
  {
    name: 'Blog',
    url: '/blog',
  },
  {
    name: 'Careers',
    url: '/careers',
  },
];

export const HomeFooterLinks = [
  {
    name: 'Product',
    links: [
      {
        name: 'Download',
        url: '/Download',
      },
      {
        name: 'Nitro',
        url: '/nitro',
      },
      {
        name: 'Status',
        url: '/status',
      },
      {
        name: 'App Directory',
        url: '/application-directory',
      },
      {
        name: 'New Mobile Experience',
        url: '/mobile',
      },
    ],
  },
  {
    name: 'Company',
    links: [
      {
        name: 'About',
        url: '/about',
      },
      {
        name: 'Jobs',
        url: '/jobs',
      },
      {
        name: 'Brand',
        url: '/brands',
      },
      {
        name: 'Newsroom',
        url: '/newsroom',
      },
      {
        name: 'Fall Release',
        url: '/fallrelease',
      },
    ],
  },
  {
    name: 'Resources',
    links: [
      {
        name: 'College',
        url: '/colleges',
      },
      {
        name: 'Support',
        url: '/support',
      },
      {
        name: 'Safety',
        url: '/safety',
      },
      {
        name: 'Blog',
        url: '/blog',
      },
      {
        name: 'Feedback',
        url: '/feedback',
      },
      {
        name: 'StreamKit',
        url: '/streamKit',
      },
      {
        name: 'Creators',
        url: '/creators',
      },
      {
        name: 'Community',
        url: '/community',
      },
      {
        name: 'Developers',
        url: '/developers',
      },
      {
        name: 'Gaming',
        url: '/gaming',
      },
      {
        name: 'Official 3rd Party Merch',
        url: 'https://discordmerch.com/?utm_source=shortlink&utm_lkey=z5bm6',
      },
    ],
  },
  {
    name: 'Policies',
    links: [
      {
        name: 'Terms',
        url: '/terms',
      },
      {
        name: 'Privacy',
        url: '/privacy',
      },
      {
        name: 'Cookie Settings',
        url: '/cookie-settings',
      },
      {
        name: 'Guidelines',
        url: '/guidelines',
      },
      {
        name: 'Acknowledgements',
        url: '/acknowledgements',
      },
      {
        name: 'Licenses',
        url: '/licenses',
      },
      {
        name: 'Company Information',
        url: '/company-information',
      },
    ],
  },
];

// Re-export from shared package for convenience
export { ApplicationFileType, ConversationsData };
