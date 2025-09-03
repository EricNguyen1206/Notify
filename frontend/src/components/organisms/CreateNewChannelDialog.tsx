import { Dispatch, FormEvent, SetStateAction } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserSearchInput } from "@/components/molecules/UserSearchInput";
import { useCreateChannel } from "@/hooks/useCreateChannel";
import type { ChatServiceInternalModelsUserResponse } from "@/services/schemas";

interface CreateNewChannelDialogProps {
  openCreateChannel: boolean;
  setOpenCreateChannel: Dispatch<SetStateAction<boolean>>;
  children: React.ReactNode;
}

const CreateNewChannelDialog = (props: CreateNewChannelDialogProps) => {
  const { openCreateChannel, setOpenCreateChannel, children } = props;

  const { formData, loading, createChannel, updateFormData, updateSelectedUsers, resetForm } = useCreateChannel({
    defaultType: "group",
    onSuccess: () => {
      // Close dialog and reset form on successful creation
      setOpenCreateChannel(false);
    },
  });

  const handleCreateNewChannel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createChannel();
  };

  const handleDialogChange = (open: boolean) => {
    setOpenCreateChannel(open);
    if (!open) {
      // Reset form when dialog is closed
      resetForm();
    }
  };

  return (
    <Dialog open={openCreateChannel} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleCreateNewChannel}>
          <div className="flex flex-col gap-3">
            <Label htmlFor="name" className="text-[12px] font-bold text-left">
              CHANNEL NAME
            </Label>
            <Input
              id="name"
              className="col-span-3"
              placeholder="Enter channel name"
              value={formData.name}
              onChange={(e) => {
                updateFormData({ name: e.target.value });
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-[12px] font-bold text-left">SELECT USERS</Label>
            <UserSearchInput
              selectedUsers={formData.selectedUsers}
              onUsersChange={updateSelectedUsers}
              maxUsers={4}
              minUsers={2}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={loading || formData.selectedUsers.length < 2}>
              {loading ? "Creating..." : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewChannelDialog;
