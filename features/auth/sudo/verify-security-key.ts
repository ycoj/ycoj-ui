import ClientApis from '@/api/client/method';
import {
  backendPathname,
  isLoginRedirect,
  isSudoRequired,
  matchesBackendPath,
  throwBackendError,
} from '@/shared/lib/backend-response';
import { startAuthentication } from '@simplewebauthn/browser';

export async function verifySecurityKey(
  returnPath: string,
  failureMessage: string
) {
  const options = await ClientApis.Auth.getWebauthnOptions().send();
  throwBackendError(options);
  if (!('authOptions' in options)) throw new Error(failureMessage);
  const result = await startAuthentication({
    optionsJSON: options.authOptions,
  });
  const response = await ClientApis.Auth.verifyWebauthn(result).send();
  throwBackendError(response);
  if (!('url' in response) || typeof response.url !== 'string')
    throw new Error(failureMessage);
  if (isLoginRedirect(response.url)) throw new Error(failureMessage);
  if (
    matchesBackendPath(response.url, returnPath) ||
    isSudoRequired(response) ||
    backendPathname(response.url) === '/'
  )
    return options.authOptions.challenge;
  throw new Error(failureMessage);
}
