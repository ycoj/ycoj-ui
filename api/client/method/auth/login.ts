import { clientRequest } from '@/api/client';

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

export const login = (payload: LoginRequest) =>
  clientRequest.Post<LoginResponse>('/login', payload);
