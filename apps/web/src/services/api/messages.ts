import { ApiErrorResponse, MessageDto, PaginatedApiResponse } from '@notify/types';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '../axios-config';

export interface ConversationMessagesParams {
  limit?: number;
  before?: number;
}

const fetchConversationMessages = async (
  conversationId: string,
  params?: ConversationMessagesParams
): Promise<PaginatedApiResponse<MessageDto[]>> => {
  const { data } = await apiClient.get<PaginatedApiResponse<MessageDto[]>>(
    `/messages/conversation/${conversationId}`,
    {
      params,
    }
  );
  return data;
};

export const useConversationMessagesQuery = <TData = PaginatedApiResponse<MessageDto[]>>(
  conversationId: string | undefined,
  params?: ConversationMessagesParams,
  options?: UseQueryOptions<PaginatedApiResponse<MessageDto[]>, AxiosError<ApiErrorResponse>, TData>
): UseQueryResult<TData, AxiosError<ApiErrorResponse>> => {
  return useQuery<PaginatedApiResponse<MessageDto[]>, AxiosError<ApiErrorResponse>, TData>({
    queryKey: ['messages', conversationId, params],
    queryFn: () => fetchConversationMessages(conversationId!, params),
    enabled: Boolean(conversationId),
    ...options,
  });
};
