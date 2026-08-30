'server-only';

import Account from '@/api/server/method/account';
import AccountExpiration from '@/api/server/method/account-expiration';
import Auth from '@/api/server/method/auth';
import Contests from '@/api/server/method/contests';
import Discussion from '@/api/server/method/discussion';
import Homework from '@/api/server/method/homework';
import Messages from '@/api/server/method/messages';
import Problems from '@/api/server/method/problems';
import Ranking from '@/api/server/method/ranking';
import Realname from '@/api/server/method/realname';
import Record from '@/api/server/method/record';
import Training from '@/api/server/method/training';
import UI from '@/api/server/method/ui';
import User from '@/api/server/method/user';

const ServerApis = {
  Account,
  AccountExpiration,
  Auth,
  UI,
  Problems,
  Record,
  Discussion,
  Contests,
  Homework,
  Messages,
  Training,
  Ranking,
  Realname,
  User,
};

export default ServerApis;
