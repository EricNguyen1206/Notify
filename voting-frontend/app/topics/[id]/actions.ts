'use server'

import api from "@/lib/api";

export async function vote(topicId: string, optionId: string) {
  const userId = localStorage.getItem("user_id");
  const response = await api.post(`/topics/${topicId}/vote`, { option_id: optionId, user_id: userId });
  return response.data;
}

export async function getTopic(topicId: string) {
  const response = await api.get(`/topics/${topicId}`);
  return response.data;
}