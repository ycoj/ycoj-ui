import { getLoginFactors, login } from './login';
import { logout } from './logout';
import { completePasswordReset, requestPasswordReset } from './recovery';
import {
  confirmSudo,
  getWebauthnOptions,
  verifyWebauthn,
  resumeSudoAction,
} from './sudo';

const Auth = {
  login,
  getLoginFactors,
  logout,
  confirmSudo,
  getWebauthnOptions,
  verifyWebauthn,
  resumeSudoAction,
  requestPasswordReset,
  completePasswordReset,
};

export default Auth;
