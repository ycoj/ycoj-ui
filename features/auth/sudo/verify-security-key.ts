import ClientApis from '@/api/client/method';
import {
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
  if (!('url' in response) || !matchesBackendPath(response.url, returnPath))
    throw new Error(failureMessage);
  return options.authOptions.challenge;
}
