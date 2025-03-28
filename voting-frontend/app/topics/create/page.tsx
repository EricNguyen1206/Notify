"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTopicSync, CreateTopicFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CreateTopicPage() {
  const router = useRouter();

  // ✅ Use useActionState with explicit types
  const [state, formAction] = useActionState<CreateTopicFormState, FormData>(
    createTopicSync as (state: CreateTopicFormState, payload: FormData) => CreateTopicFormState,
    { error: null, success: null }
  );

  // ✅ Detect success and show toast, then redirect
  useEffect(() => {
    if (state?.success) {
      toast.success("Topic created successfully!");
      setTimeout(() => router.push("/topics"), 2000); // Redirect after 2 sec
    }
  }, [state?.success, router]);

  return (
    <div className="flex justify-center items-center min-h-screen p-6 bg-gray-100">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle>Create Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="Enter topic title" required />
              {state?.error?.title && <p className="text-red-500 text-sm">{state.error.title._errors[0]}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Enter topic description" required />
              {state?.error?.description && <p className="text-red-500 text-sm">{state.error.description._errors[0]}</p>}
            </div>

            {/* Start Time */}
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" name="startTime" type="datetime-local" required />
              {state?.error?.startTime && <p className="text-red-500 text-sm">{state.error.startTime._errors[0]}</p>}
            </div>

            {/* End Time */}
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" name="endTime" type="datetime-local" required />
              {state?.error?.endTime && <p className="text-red-500 text-sm">{state.error.endTime._errors[0]}</p>}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">Create Topic</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
