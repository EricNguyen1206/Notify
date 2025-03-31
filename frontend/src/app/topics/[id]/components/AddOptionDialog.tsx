'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/registry/new-york-v4/ui/dialog';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';

import { addOptionToTopic } from '../actions';
import { toast } from 'sonner';

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
                <Button variant='outline'>Add Option</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>Add a New Option</DialogHeader>
                <form action={formAction} className='space-y-3'>
                    <input type='hidden' name='topicId' value={topicId} />
                    <Label>Title</Label>
                    <Input name='title' required />
                    {state?.error?.title && <p className='text-red-500'>{state.error.title._errors[0]}</p>}

                    <Label>Image URL</Label>
                    <Input name='imageUrl' required />
                    {state?.error?.imageUrl && <p className='text-red-500'>{state.error.imageUrl._errors[0]}</p>}

                    <Button type='submit'>Submit</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
