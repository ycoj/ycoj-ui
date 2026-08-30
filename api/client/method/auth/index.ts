import { login } from './login';
import { logout } from './logout';
import {
  confirmSudo,
  getWebauthnOptions,
  verifyWebauthn,
  resumeSudoAction,
} from './sudo';

const Auth = {
  login,
  logout,
  confirmSudo,
  getWebauthnOptions,
  verifyWebauthn,
  resumeSudoAction,
};

export default Auth;
