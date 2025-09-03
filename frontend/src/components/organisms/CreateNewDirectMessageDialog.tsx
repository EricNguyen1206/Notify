import { Dispatch, FormEvent, SetStateAction, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserSearchInput } from "@/components/molecules/UserSearchInput";
import { useCreateChannel } from "@/hooks/useCreateChannel";
import type { ChatServiceInternalModelsUserResponse } from "@/services/schemas";
import { useChannelStore } from "@/store/useChannelStore";
import { useAuthStore } from "@/store/useAuthStore";

interface CreateNewDirectMessageDialogProps {
  openDirectMessage: boolean;
  setOpenDirectMessage: Dispatch<SetStateAction<boolean>>;
  children: React.ReactNode;
}

const CreateNewDirectMessageDialog = (props: CreateNewDirectMessageDialogProps) => {
  const { openDirectMessage, setOpenDirectMessage, children } = props;
  const router = useRouter();

  const { user } = useAuthStore((state) => state);
  const { directChannels } = useChannelStore((state) => state);

  const { formData, loading, createChannel, updateSelectedUsers, resetForm } = useCreateChannel({
    defaultType: "direct",
    onSuccess: (channel) => {
      // Navigate to the newly created channel
      router.push(`/messages/${channel.id}`);
      setOpenDirectMessage(false);
    },
  });

  // Check if selected users already have a direct channel
  const existingDirectChannel = useMemo(() => {
    if (formData.selectedUsers.length !== 1) return null;

    const selectedUser = formData.selectedUsers[0];
    if (!selectedUser || !user) return null;

    // Find existing direct channel between current user and selected user
    // Now using email for uniqueness since backend returns email as channel name for direct channels
    return directChannels.find((channel) => {
      if (channel.type !== "direct") return false;

      // Check if channel name matches the selected user's email
      const selectedUserEmail = selectedUser.email?.toLowerCase() || "";
      const channelName = channel.name.toLowerCase();

      return channelName === selectedUserEmail;
    });
  }, [formData.selectedUsers, directChannels, user]);

  const handleCreateDirectMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If there's an existing direct channel, navigate to it
    if (existingDirectChannel) {
      router.push(`/messages/${existingDirectChannel.id}`);
      setOpenDirectMessage(false);
      return;
    }

    // Otherwise create a new direct channel
    await createChannel();
  };

  const handleDialogChange = (open: boolean) => {
    setOpenDirectMessage(open);
    if (!open) {
      // Reset form when dialog is closed
      resetForm();
    }
  };

  const handleUserSelection = (users: ChatServiceInternalModelsUserResponse[]) => {
    updateSelectedUsers(users);
  };

  return (
    <Dialog open={openDirectMessage} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleCreateDirectMessage}>
          <div className="flex flex-col gap-3">
            <Label className="text-[12px] font-bold text-left">SELECT USER</Label>
            <UserSearchInput
              selectedUsers={formData.selectedUsers}
              onUsersChange={handleUserSelection}
              maxUsers={1}
              minUsers={1}
              disabled={loading}
            />
          </div>

          {existingDirectChannel && formData.selectedUsers.length === 1 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Direct message channel already exists with {formData.selectedUsers[0]?.email}. Click "Open Channel" to
                join.
              </p>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={loading || formData.selectedUsers.length !== 1}>
              {loading ? "Creating..." : existingDirectChannel ? "Open Channel" : "Create Direct Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewDirectMessageDialog;
