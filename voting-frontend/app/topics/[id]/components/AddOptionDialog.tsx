"use client";

import { useState, useActionState } from "react";
import { addOptionToTopic } from "../actions";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddOptionDialog({ topicId }: { topicId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addOptionToTopic, { error: null, success: null });

  if (state?.success) {
    toast.success(state.success);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Option</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>Add a New Option</DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="topicId" value={topicId} />
          <Label>Title</Label>
          <Input name="title" required />
          {state?.error?.title && <p className="text-red-500">{state.error.title._errors[0]}</p>}
          
          <Label>Image URL</Label>
          <Input name="imageUrl" required />
          {state?.error?.imageUrl && <p className="text-red-500">{state.error.imageUrl._errors[0]}</p>}
          
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
