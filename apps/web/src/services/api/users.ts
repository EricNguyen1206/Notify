import { ApiErrorResponse, UpdateProfileRequest, UserResponse } from "@notify/types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiClient } from "../axios-config";

const searchUsers = async (username: string): Promise<UserResponse[]> => {
  const { data } = await apiClient.get<UserResponse[]>("/users/search", {
    params: { username },
  });
  return data;
};

const updateProfile = async (payload: UpdateProfileRequest): Promise<UserResponse> => {
  const { data } = await apiClient.put<UserResponse>("/users/profile", payload);
  return data;
};

export const useSearchUsersQuery = <TData = UserResponse[]>(
  username: string,
  options?: UseQueryOptions<UserResponse[], AxiosError<ApiErrorResponse>, TData>
): UseQueryResult<TData, AxiosError<ApiErrorResponse>> => {
  return useQuery<UserResponse[], AxiosError<ApiErrorResponse>, TData>({
    queryKey: ["users", "search", username],
    queryFn: () => searchUsers(username),
    enabled: username.length >= 2,
    staleTime: 30_000,
    ...options,
  });
};

export const useUpdateProfileMutation = (
  options?: UseMutationOptions<UserResponse, AxiosError<ApiErrorResponse>, UpdateProfileRequest>
) => {
  return useMutation<UserResponse, AxiosError<ApiErrorResponse>, UpdateProfileRequest>({
    mutationKey: ["users", "profile", "update"],
    mutationFn: updateProfile,
    ...options,
  });
};

