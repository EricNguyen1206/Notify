"use client";

// import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
