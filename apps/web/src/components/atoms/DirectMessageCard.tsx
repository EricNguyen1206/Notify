import { ConversationDto } from '@notify/types';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Link from 'next/link';
import { SidebarMenuItem } from '../ui/sidebar';
import { cn } from '@/lib/utils';

type DirectMessageCardProps = {
  convo: ConversationDto;
  isActive: boolean;
};

const DirectMessageCard = ({ convo, isActive }: DirectMessageCardProps) => {
  const displayName = convo.name.split('@')[0];
  return (
    <SidebarMenuItem className={cn(isActive && 'bg-primary/10')}>
      <Link
        href={`/messages/${convo.id}`}
        className="flex items-center cursor-pointer transition-colors rounded-md p-2 mb-1"
      >
        <div className="relative mr-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={convo.avatar} />
            <AvatarFallback color="#8B5CF6">
              {convo.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-foreground text-sm truncate">{displayName}</h4>
          </div>
        </div>
      </Link>
    </SidebarMenuItem>
  );
};

export default DirectMessageCard;
