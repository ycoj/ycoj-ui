import { alova } from '@/api/server';
import type { BackendError, SudoPageData } from '@/shared/types/sudo';

export const getSudoPage = () =>
  alova.Get<SudoPageData | BackendError>('/user/sudo', {
    cacheFor: 0,
  });

const Auth = { getSudoPage };
export default Auth;
