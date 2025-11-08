import { ConversationType } from './conversation';

// Server Type (Frontend specific)
export interface ServerType {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  conversations: ConversationType[];
}

