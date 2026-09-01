import { clientRequest } from '@/api/client';
import type { BackendError } from '@/shared/types/sudo';

export type LoginRequest = {
  uname: string;
  password: string;
  rememberme?: boolean;
  redirect?: string;
  tfa?: string;
  authnChallenge?: string;
};

export type LoginResponse = {
  url: string;
};

export type LoginFactors = {
  authn: boolean;
  tfa: boolean;
};

export const login = (payload: LoginRequest) =>
  clientRequest.Post<LoginResponse | BackendError>('/login', payload);

export const getLoginFactors = (uname: string) =>
  clientRequest.Get<LoginFactors | BackendError>('/user/tfa', {
    params: { q: uname },
    cacheFor: 0,
  });
