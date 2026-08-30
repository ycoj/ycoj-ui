import { alova } from '@/api/server';
import type { BackendError } from '@/shared/types/sudo';

export const getSudoPage = () =>
  alova.Get<Record<string, never> | BackendError>('/user/sudo', {
    cacheFor: 0,
  });

const Auth = { getSudoPage };
export default Auth;
