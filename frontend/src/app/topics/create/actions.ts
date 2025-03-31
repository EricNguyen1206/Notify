"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";

export type CreateTopicFormState = {
  error: z.ZodFormattedError<{ title: string; description: string; startTime: string; endTime: string }, string> | null;
  success: string | null;
};

// Schema for validation
const formSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Correct function type for useActionState
export function createTopicSync(
  prevState: CreateTopicFormState, // ✅ Previous state
  formData: FormData // ✅ Form data
): CreateTopicFormState {
  const data = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
  };

  // Validate input
  const parsed = formSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.format(), success: null };
  }

  // Async save function (this runs separately)
  saveTopic(parsed.data);

  return { error: null, success: "Processing topic creation..." };
}

// Async function to actually save the topic
async function saveTopic(data: { title: string; description: string; startTime: string; endTime: string }) {
  try {
    console.log("Saving topic:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async operation
    revalidatePath("/topics");
  } catch (error) {
    console.error("Error saving topic:", error);
  }
}
