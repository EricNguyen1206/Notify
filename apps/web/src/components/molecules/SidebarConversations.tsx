import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import CreateNewConversationDialog from '../organisms/CreateNewConversationDialog';
import ConversationsSkeleton from './ConversationsSkeleton';
import GroupMessageCard from '../atoms/GroupMessageCard';
import { ConversationDto } from '@notify/types';
import { ConversationState, useConversationStore } from '@/store/useConversationStore';

type SidebarGroupMessagesProps = {
  items: ConversationDto[];
  loading: boolean;
};

export const SidebarConversations = ({ items, loading }: SidebarGroupMessagesProps) => {
  const [openCreateConversation, setOpenCreateConversation] = useState(false);
  const activeConversationId = useConversationStore(
    (state: ConversationState) => state.activeConversationId
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Groups</SidebarGroupLabel>
      <div className="flex gap-1">
        <CreateNewConversationDialog
          openCreateConversation={openCreateConversation}
          setOpenCreateConversation={setOpenCreateConversation}
        >
          <SidebarGroupAction onClick={() => setOpenCreateConversation(true)}>
            <Plus /> <span className="sr-only">Add Conversation</span>
          </SidebarGroupAction>
        </CreateNewConversationDialog>
      </div>

      <SidebarMenu>
        {loading ? (
          <ConversationsSkeleton />
        ) : (
          items.map((convo) => (
            <GroupMessageCard
              key={convo.id}
              convo={convo}
              isActive={convo.id === activeConversationId}
            />
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SidebarConversations;
