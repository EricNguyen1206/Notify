import { Plus } from 'lucide-react';
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu } from '../ui/sidebar';
import ChannelsSkeleton from './ChannelsSkeleton';
import CreateNewDirectMessageDialog from '../organisms/CreateNewDirectMessageDialog';
import { useState } from 'react';
import DirectMessageCard from '../atoms/DirectMessageCard';
import { ConversationDto } from '@notify/types';
import { ConversationState, useConversationStore } from '@/store/useConversationStore';

type SidebarDirectMessagesProps = {
  items: ConversationDto[];
  loading: boolean;
};

const SidebarDirectMessages = ({ items, loading }: SidebarDirectMessagesProps) => {
  const [openDirectMessage, setOpenDirectMessage] = useState(false);
  const activeConversationId = useConversationStore(
    (state: ConversationState) => state.activeConversationId
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
      <div className="flex gap-1">
        <CreateNewDirectMessageDialog
          openDirectMessage={openDirectMessage}
          setOpenDirectMessage={setOpenDirectMessage}
        >
          <SidebarGroupAction onClick={() => setOpenDirectMessage(true)}>
            <Plus /> <span className="sr-only">Direct Message</span>
          </SidebarGroupAction>
        </CreateNewDirectMessageDialog>
      </div>
      <SidebarMenu>
        {loading ? (
          <ChannelsSkeleton />
        ) : (
          items.map((item) => {
            return (
              <DirectMessageCard
                key={item.id}
                convo={item}
                isActive={item.id === activeConversationId}
              />
            );
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default SidebarDirectMessages;
