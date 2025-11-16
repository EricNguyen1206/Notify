import { SigninRequest, SigninResponse, RegisterRequest, UserResponse, ApiErrorResponse, RefreshTokenResponse, ApiMessageResponse } from "@notify/types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { apiClient } from "../axios-config";

const signin = async (payload: SigninRequest): Promise<SigninResponse> => {
  const { data } = await apiClient.post<SigninResponse>("/auth/signin", payload);
  return data;
};

const signup = async (payload: RegisterRequest): Promise<{ success: boolean; data: UserResponse }> => {
  const { data } = await apiClient.post<{ success: boolean; data: UserResponse }>("/auth/signup", payload);
  return data;
};

const signout = async (): Promise<ApiMessageResponse> => {
  const { data } = await apiClient.post<ApiMessageResponse>("/auth/signout");
  return data;
};

const refresh = async (): Promise<RefreshTokenResponse> => {
  const { data } = await apiClient.post<RefreshTokenResponse>("/auth/refresh");
  return data;
};

export const useSigninMutation = (
  options?: UseMutationOptions<SigninResponse, AxiosError<ApiErrorResponse>, SigninRequest>
) => {
  return useMutation<SigninResponse, AxiosError<ApiErrorResponse>, SigninRequest>({
    mutationKey: ["auth", "signin"],
    mutationFn: signin,
    ...options,
  });
};

export const useSignupMutation = (
  options?: UseMutationOptions<{ success: boolean; data: UserResponse }, AxiosError<ApiErrorResponse>, RegisterRequest>
) => {
  return useMutation<{ success: boolean; data: UserResponse }, AxiosError<ApiErrorResponse>, RegisterRequest>({
    mutationKey: ["auth", "signup"],
    mutationFn: signup,
    ...options,
  });
};

export const useSignoutMutation = (
  options?: UseMutationOptions<ApiMessageResponse, AxiosError<ApiErrorResponse>, void>
) => {
  return useMutation<ApiMessageResponse, AxiosError<ApiErrorResponse>, void>({
    mutationKey: ["auth", "signout"],
    mutationFn: signout,
    ...options,
  });
};

export const useRefreshMutation = (
  options?: UseMutationOptions<RefreshTokenResponse, AxiosError<ApiErrorResponse>, void>
) => {
  return useMutation<RefreshTokenResponse, AxiosError<ApiErrorResponse>, void>({
    mutationKey: ["auth", "refresh"],
    mutationFn: refresh,
    ...options,
  });
};

// Backward compatibility (deprecated)
export const useLoginMutation = useSigninMutation;
export const useRegisterMutation = useSignupMutation;

