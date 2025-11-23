import {
  UserDto,
  ApiErrorResponse,
  ApiMessageResponse,
  ApiResponse,
} from '@notify/types';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { apiClient } from '../axios-config';
import { SigninRequestDto, SignupRequestDto } from '@/validators/index';

const signin = async (payload: SigninRequestDto): Promise<ApiResponse<UserDto>> => {
  const { data } = await apiClient.post<ApiResponse<UserDto>>('/auth/signin', payload);
  return data;
};

const signup = async (payload: SignupRequestDto): Promise<{ success: boolean; data: UserDto }> => {
  const { data } = await apiClient.post<{ success: boolean; data: UserDto }>(
    '/auth/signup',
    payload
  );
  return data;
};

const signout = async (): Promise<ApiMessageResponse> => {
  const { data } = await apiClient.post<ApiMessageResponse>('/auth/signout');
  return data;
};

const refresh = async () => {
  const { data } = await apiClient.post('/auth/refresh');
  return data;
};

export const useSigninMutation = (
  options?: UseMutationOptions<ApiResponse<UserDto>, AxiosError<ApiErrorResponse>, SigninRequestDto>
) => {
  return useMutation<ApiResponse<UserDto>, AxiosError<ApiErrorResponse>, SigninRequestDto>({
    mutationKey: ['auth', 'signin'],
    mutationFn: signin,
    ...options,
  });
};

export const useSignupMutation = (
  options?: UseMutationOptions<
    { success: boolean; data: UserDto },
    AxiosError<ApiErrorResponse>,
    SignupRequestDto
  >
) => {
  return useMutation<
    { success: boolean; data: UserDto },
    AxiosError<ApiErrorResponse>,
    SignupRequestDto
  >({
    mutationKey: ['auth', 'signup'],
    mutationFn: signup,
    ...options,
  });
};

export const useSignoutMutation = (
  options?: UseMutationOptions<ApiMessageResponse, AxiosError<ApiErrorResponse>, void>
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, void>({
    mutationKey: ['auth', 'signout'],
    mutationFn: signout,
    ...options,
  });
};

export const useRefreshMutation = (
  options?: UseMutationOptions<ApiMessageResponse, AxiosError<ApiErrorResponse>, void>
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, void>({
    mutationKey: ['auth', 'refresh'],
    mutationFn: refresh,
    ...options,
  });
};

// Backward compatibility (deprecated)
export const useLoginMutation = useSigninMutation;
export const useRegisterMutation = useSignupMutation;
