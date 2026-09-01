import ClientApis from '@/api/client/method';
import { throwBackendError } from '@/shared/lib/backend-response';
import { startAuthentication } from '@simplewebauthn/browser';

export async function verifyLoginSecurityKey(
  uname: string,
  failureMessage: string
) {
  const options = await ClientApis.Auth.getWebauthnOptions({
    uname,
    login: false,
  }).send();
  throwBackendError(options);
  if (!('authOptions' in options)) throw new Error(failureMessage);

  const result = await startAuthentication({
    optionsJSON: options.authOptions,
  });
  const response = await ClientApis.Auth.verifyWebauthn(result).send();
  throwBackendError(response);
  return options.authOptions.challenge;
}
