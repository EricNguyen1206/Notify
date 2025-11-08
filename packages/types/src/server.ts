import { ChannelType } from './channel';

// Server Type (Frontend specific)
export interface ServerType {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  channels: ChannelType[];
}

