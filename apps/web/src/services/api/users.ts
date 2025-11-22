import { ApiErrorResponse, ApiResponse, UpdateProfileRequest, UserDto } from '@notify/types';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '../axios-config';

const getCurrentUser = async (): Promise<UserDto> => {
  const { data } = await apiClient.get<ApiResponse<UserDto>>('/users/profile');
  return data.data;
};

const searchUsers = async (username: string): Promise<UserDto[]> => {
  const { data } = await apiClient.get<UserDto[]>('/users/search', {
    params: { username },
  });
  return data;
};

const updateProfile = async (payload: UpdateProfileRequest): Promise<UserDto> => {
  const { data } = await apiClient.put<ApiResponse<UserDto>>('/users/profile', payload);
  return data.data;
};

export const useCurrentUserQuery = (
  options?: UseQueryOptions<UserDto, AxiosError<ApiErrorResponse>>
): UseQueryResult<UserDto, AxiosError<ApiErrorResponse>> => {
  return useQuery<UserDto, AxiosError<ApiErrorResponse>>({
    queryKey: ['user', 'current'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 (unauthorized)
      if (error.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

export const useSearchUsersQuery = (
  username: string
): UseQueryResult<UserDto[], AxiosError<ApiErrorResponse>> => {
  return useQuery({
    queryKey: ['users', 'search', username],
    queryFn: () => searchUsers(username),
    enabled: !!username && username.length >= 2,
    staleTime: 30_000,
  });
};

export const useUpdateProfileMutation = (
  options?: UseMutationOptions<UserDto, AxiosError<ApiErrorResponse>, UpdateProfileRequest>
) => {
  return useMutation<UserDto, AxiosError<ApiErrorResponse>, UpdateProfileRequest>({
    mutationKey: ['users', 'profile', 'update'],
    mutationFn: updateProfile,
    ...options,
  });
};
