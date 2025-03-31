"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const optionSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  imageUrl: z.string().url("Invalid URL"),
  topicId: z.string()
});

type AddOptionFormState = {
  success: string | null;
  error: z.ZodFormattedError<{ title: string; imageUrl: string; topicId: string }, string> | null;
};

export async function addOptionToTopic(
  prevState: AddOptionFormState,
  formData: FormData
):Promise<AddOptionFormState> {
  const data = {
    title: formData.get("title"),
    imageUrl: formData.get("imageUrl"),
    topicId: formData.get("topicId"),
  };

  const parsed = optionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.format() as z.ZodFormattedError<{ title: string; imageUrl: string; topicId: string }, string>, success: null };
  }

  await fetch("/api/options", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  revalidatePath(`/topics/${data.topicId}`);

  return { error: null, success: "Option added successfully!" };
}

type VoteForOptionFormState = {
  success: string | null;
  error: z.ZodFormattedError<{ optionId: string; topicId: string }, string> | null;
};

export async function voteForOption(prevState: VoteForOptionFormState, formData: FormData): Promise<VoteForOptionFormState> {
  const optionId = formData.get("optionId") as string;
  await fetch("/api/options/vote", {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });
  revalidatePath(`/topics/${formData.get("topicId")}`);

  return { error: null, success: "Vote counted successfully!" };
}
