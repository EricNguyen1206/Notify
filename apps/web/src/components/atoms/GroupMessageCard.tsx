import { ConversationDto } from '@notify/types';
import { Hash } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type GroupMessageCardProps = {
  convo: ConversationDto;
  isActive: boolean;
};

const GroupMessageCard = ({ convo, isActive }: GroupMessageCardProps) => {
  return (
    <SidebarMenuItem className={cn(isActive && 'bg-primary/10')}>
      <SidebarMenuButton tooltip={convo.name}>
        <Hash />
        <Link href={`/messages/${convo.id}`}>
          <span>{convo.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default GroupMessageCard;
