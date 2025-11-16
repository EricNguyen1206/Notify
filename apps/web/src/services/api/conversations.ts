import {
  ApiErrorResponse,
  ApiMessageResponse,
  ConversationDetailApiResponse,
  ConversationDetailResponse,
  ConversationMembershipRequest,
  ConversationMutationResponse,
  ConversationResponse,
  ConversationType,
  ConversationListApiResponse,
  CreateConversationRequest,
  UserConversationsResponse,
} from "@notify/types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  QueryKey,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiClient } from "../axios-config";

const CONVERSATIONS_QUERY_KEY = ["conversations"];

const fetchConversations = async (): Promise<UserConversationsResponse> => {
  const { data } = await apiClient.get<ConversationListApiResponse>("/conversations");
  return data.data;
};

const fetchConversationById = async (id: string): Promise<ConversationDetailResponse> => {
  const { data } = await apiClient.get<ConversationDetailApiResponse>(`/conversations/${id}`);
  return data.data;
};

const createConversationRequest = async (payload: CreateConversationRequest): Promise<ConversationResponse> => {
  const { data } = await apiClient.post<ConversationMutationResponse>("/conversations", payload);
  return data.data;
};

const deleteConversationRequest = async (id: string): Promise<ApiMessageResponse> => {
  const { data } = await apiClient.delete<ApiMessageResponse>(`/conversations/${id}`);
  return data;
};

const leaveConversationRequest = async (id: string): Promise<ApiMessageResponse> => {
  const { data } = await apiClient.put<ApiMessageResponse>(`/conversations/${id}/user`, {});
  return data;
};

const addUserToConversationRequest = async ({
  id,
  body,
}: {
  id: string;
  body: ConversationMembershipRequest;
}): Promise<ApiMessageResponse> => {
  const { data } = await apiClient.post<ApiMessageResponse>(`/conversations/${id}/user`, body);
  return data;
};

const removeUserFromConversationRequest = async ({
  id,
  body,
}: {
  id: string;
  body: ConversationMembershipRequest;
}): Promise<ApiMessageResponse> => {
  const { data } = await apiClient.delete<ApiMessageResponse>(`/conversations/${id}/user`, { data: body });
  return data;
};

export const useConversationsQuery = <TData = UserConversationsResponse>(
  options?: UseQueryOptions<UserConversationsResponse, AxiosError<ApiErrorResponse>, TData>
): UseQueryResult<TData, AxiosError<ApiErrorResponse>> => {
  return useQuery<UserConversationsResponse, AxiosError<ApiErrorResponse>, TData>({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    staleTime: 30_000,
    ...options,
  });
};

export const useConversationQuery = <TData = ConversationDetailResponse>(
  id: string | undefined,
  options?: UseQueryOptions<ConversationDetailResponse, AxiosError<ApiErrorResponse>, TData>
): UseQueryResult<TData, AxiosError<ApiErrorResponse>> => {
  return useQuery<ConversationDetailResponse, AxiosError<ApiErrorResponse>, TData>({
    queryKey: [...CONVERSATIONS_QUERY_KEY, id] as QueryKey,
    queryFn: () => fetchConversationById(id!),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreateConversationMutation = (
  options?: UseMutationOptions<
    ConversationResponse,
    AxiosError<ApiErrorResponse>,
    CreateConversationRequest & { type: ConversationType }
  >
) => {
  return useMutation<ConversationResponse, AxiosError<ApiErrorResponse>, CreateConversationRequest>({
    mutationKey: ["conversations", "create"],
    mutationFn: createConversationRequest,
    ...options,
  });
};

export const useDeleteConversationMutation = (
  options?: UseMutationOptions<ApiMessageResponse, AxiosError<ApiErrorResponse>, string>
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, string>({
    mutationKey: ["conversations", "delete"],
    mutationFn: deleteConversationRequest,
    ...options,
  });
};

export const useLeaveConversationMutation = (
  options?: UseMutationOptions<ApiMessageResponse, AxiosError<ApiErrorResponse>, string>
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, string>({
    mutationKey: ["conversations", "leave"],
    mutationFn: leaveConversationRequest,
    ...options,
  });
};

export const useAddConversationMemberMutation = (
  options?: UseMutationOptions<
    ApiMessageResponse,
    AxiosError<ApiErrorResponse>,
    { id: string; body: ConversationMembershipRequest }
  >
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, { id: string; body: ConversationMembershipRequest }>(
    {
      mutationKey: ["conversations", "members", "add"],
      mutationFn: addUserToConversationRequest,
      ...options,
    }
  );
};

export const useRemoveConversationMemberMutation = (
  options?: UseMutationOptions<
    ApiMessageResponse,
    AxiosError<ApiErrorResponse>,
    { id: string; body: ConversationMembershipRequest }
  >
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, { id: string; body: ConversationMembershipRequest }>(
    {
      mutationKey: ["conversations", "members", "remove"],
      mutationFn: removeUserFromConversationRequest,
      ...options,
    }
  );
};

