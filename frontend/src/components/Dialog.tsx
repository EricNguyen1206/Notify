'use client';

// import { Button } from "@/registry/new-york-v4/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/registry/new-york-v4/ui/dialog';

interface DialogProps {
    trigger: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

export default function CustomDialog({ trigger, title, children }: DialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
