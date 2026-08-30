'server-only';

import Account from './account';
import Contests from './contests';
import Discussion from './discussion';
import Homework from './homework';
import Messages from './messages';
import Problems from './problems';
import Ranking from './ranking';
import Realname from './realname';
import Record from './record';
import Training from './training';
import UI from './ui';
import User from './user';

const ServerApis = {
  Account,
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
