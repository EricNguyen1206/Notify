import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Smile, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";

import { DirectMessageChatType, UserType } from "@/types";

import { formatDateStr, getSummaryName } from "@/lib/helper";
import { useAuthStore } from "@/store/useAuthStore";

interface PropType {
  userIdSession: number;
  chat: DirectMessageChatType;
  friend?: UserType;
  mainRef: React.RefObject<HTMLDivElement>;
  handleDeleteChatById: (chatId: number) => void;
  handleDownloadFile: (
    bucket: string,
    folderName: string,
    chat: DirectMessageChatType
  ) => void;
}

const ImageChat = (props: PropType) => {
  const { user } = useAuthStore((state) => state);
  const {
    userIdSession,
    chat,
    friend,
    mainRef,
    handleDeleteChatById,
    handleDownloadFile,
  } = props;

  return (
    <div
      className="group relative w-[100%] flex items-center justify-between rounded-md py-2
    hover:bg-secondary-white dark:hover:bg-primary-gray"
    >
      <div className="flex items-start gap-3">
        {user?.avatar && user?.avatar !== null && (
          <div>
            <Image
              className="rounded-full"
              src={user?.avatar}
              width={40}
              height={40}
              alt="avatar"
            />
          </div>
        )}
        {user?.avatar === null && (
          <Avatar className="w-[40px] h-[40px]">
            <AvatarFallback>
              {user?.username && getSummaryName(user?.username)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col text-[13px]">
            <div className="flex items-center gap-3">
              <p className="font-bold">{`${user?.username} ${userIdSession === chat?.userId ? "(You)" : ""
                }`}</p>
              <p className="text-[12px] text-zinc-400">
                {chat?.sended ? formatDateStr(chat?.sended) : "undefined"}
              </p>
            </div>
            {user?.avatar === null && (
              <Avatar className="w-[40px] h-[40px]">
                <AvatarFallback>
                  {user?.username && getSummaryName(user?.username)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          {chat?.url && (
            <div className="flex gap-3 items-end">
              <Image
                src={chat?.url}
                className="rounded-md w-[200px] lg:w-[400px] h-auto"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                width="0"
                height="0"
                alt="image"
              />
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center p-2 rounded-md text-white bg-primary-purple hover:bg-secondary-purple"
                        onClick={() => {
                          handleDownloadFile("uploads", "images", chat);
                        }}
                      >
                        <Download size={20} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download Image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
          {/* <div className="text-[13px] flex items-center gap-3">Emoji</div> */}
        </div>
      </div>
      <div
        className="hidden absolute top-[-15px] right-[15px] group-hover:flex items-center gap-3 px-2 py-1 rounded-md
                text-gray-700 dark:text-white border border-zin-600 dark:border-primary-gray
                bg-zinc-200 dark:bg-zinc-700"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="hover:text-primary-purple">
                <Smile size={25} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add reaction</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="hover:text-red-500"
                onClick={() => {
                  if (chat?.id) handleDeleteChatById(chat?.id);
                  else toast.error("Something wrong");
                }}
              >
                <Trash2 size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div ref={mainRef} />
    </div>
  );
};

export default ImageChat;
