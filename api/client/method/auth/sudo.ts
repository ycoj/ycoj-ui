import { clientRequest } from '@/api/client';
import type {
  BackendError,
  BackendRedirect,
  SudoCredentialType,
  SudoResponse,
} from '@/shared/types/sudo';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

export type WebauthnOptionsResponse =
  | { authOptions: PublicKeyCredentialRequestOptionsJSON }
  | BackendError
  | BackendRedirect;

export const confirmSudo = (method: SudoCredentialType, value: string) =>
  clientRequest.Post<SudoResponse>('/user/sudo', { [method]: value });

export const getWebauthnOptions = (
  params: {
    uname?: string;
    login?: boolean;
  } = {}
) =>
  clientRequest.Get<WebauthnOptionsResponse>('/user/webauthn', {
    params: {
      login: params.login ?? false,
      ...(params.uname ? { uname: params.uname } : {}),
    },
    cacheFor: 0,
  });

export const verifyWebauthn = (result: AuthenticationResponseJSON) =>
  clientRequest.Post<BackendRedirect | BackendError>('/user/webauthn', {
    result,
  });

export const resumeSudoAction = (path: string, args: Record<string, unknown>) =>
  clientRequest.Post<BackendRedirect | BackendError | Record<string, unknown>>(
    path,
    args
  );
