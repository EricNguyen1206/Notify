import { Dispatch, FormEvent, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateChannel } from "@/hooks/useCreateChannel";

interface CreateNewChannelDialogProps {
  openCreateChannel: boolean;
  setOpenCreateChannel: Dispatch<SetStateAction<boolean>>;
  children: React.ReactNode;
}

const CreateNewChannelDialog = (props: CreateNewChannelDialogProps) => {
  const { openCreateChannel, setOpenCreateChannel, children } = props;

  const {
    formData,
    loading,
    createChannel,
    updateFormData,
    resetForm
  } = useCreateChannel({
    onSuccess: () => {
      // Close dialog and reset form on successful creation
      setOpenCreateChannel(false);
    }
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-8"
          onSubmit={handleCreateNewChannel}
        >
          <div className="flex flex-col gap-3">
            <Label htmlFor="name" className="text-[12px] font-bold text-left">
              CHANNEL NAME
            </Label>
            <Input
              id="name"
              className="col-span-3"
              placeholder="New category"
              value={formData.name}
              onChange={(e) => {
                updateFormData({ name: e.target.value });
              }}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant="default"
              disabled={loading}
            >
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewChannelDialog; 