import { Dispatch, FormEvent, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserSearchInput } from '@/components/molecules/UserSearchInput';
import { useCreateConversation } from '@/hooks/useCreateConversation';
import type { UserDto } from '@notify/types';

interface CreateNewConversationDialogProps {
  openCreateConversation: boolean;
  setOpenCreateConversation: Dispatch<SetStateAction<boolean>>;
  children: React.ReactNode;
}

const CreateNewConversationDialog = (props: CreateNewConversationDialogProps) => {
  const { openCreateConversation, setOpenCreateConversation, children } = props;

  const { formData, loading, createConversation, updateFormData, updateSelectedUsers, resetForm } =
    useCreateConversation({
      defaultType: 'group',
      onSuccess: () => {
        // Close dialog and reset form on successful creation
        setOpenCreateConversation(false);
      },
    });

  const handleCreateNewConversation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createConversation();
  };

  const handleDialogChange = (open: boolean) => {
    setOpenCreateConversation(open);
    if (!open) {
      // Reset form when dialog is closed
      resetForm();
    }
  };

  return (
    <Dialog open={openCreateConversation} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Conversation</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleCreateNewConversation}>
          <div className="flex flex-col gap-3">
            <Label htmlFor="name" className="text-[12px] font-bold text-left">
              CONVERSATION NAME
            </Label>
            <Input
              id="name"
              className="col-span-3"
              placeholder="Enter conversation name"
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
            <Button
              type="submit"
              variant="default"
              disabled={loading || formData.selectedUsers.length < 2}
            >
              {loading ? 'Creating...' : 'Create Conversation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewConversationDialog;
