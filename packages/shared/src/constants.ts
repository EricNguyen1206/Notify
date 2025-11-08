import { Channel } from "@notify/types";

export const ApplicationFileType: string[] = [
  "docx",
  "xlsx",
  "pdf",
  "vnd.openxmlformats-officedocument.wordprocessingml.document",
  "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const ChannelsData: Channel[] = [
  {
    id: "1",
    name: "chat-room-1",
    type: "text",
    ownerId: 1,
  },
  {
    id: "2",
    name: "chat-room-2",
    type: "text",
    ownerId: 1,
  },
  {
    id: "3",
    name: "study-chat-1",
    type: "text",
    ownerId: 1,
  },
  {
    id: "4",
    name: "study-chat-2",
    type: "text",
    ownerId: 1,
  },
  {
    id: "5",
    name: "coding-challenge-1",
    type: "text",
    ownerId: 1,
  },
  {
    id: "6",
    name: "coding-challenge-2",
    type: "voice",
    ownerId: 1,
  },
];

