import { ApiErrorResponse, ConversationMessagesApiResponse } from "@notify/types";
import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiClient } from "../axios-config";

export interface ConversationMessagesParams {
  limit?: number;
  before?: number;
}

const fetchConversationMessages = async (
  conversationId: string,
  params?: ConversationMessagesParams
): Promise<ConversationMessagesApiResponse> => {
  const { data } = await apiClient.get<ConversationMessagesApiResponse>(`/messages/conversation/${conversationId}`, {
    params,
  });
  return data;
};

export const useConversationMessagesQuery = <TData = ConversationMessagesApiResponse>(
  conversationId: string | undefined,
  params?: ConversationMessagesParams,
  options?: UseQueryOptions<ConversationMessagesApiResponse, AxiosError<ApiErrorResponse>, TData>
): UseQueryResult<TData, AxiosError<ApiErrorResponse>> => {
  return useQuery<ConversationMessagesApiResponse, AxiosError<ApiErrorResponse>, TData>({
    queryKey: ["messages", conversationId, params],
    queryFn: () => fetchConversationMessages(conversationId!, params),
    enabled: Boolean(conversationId),
    ...options,
  });
};

