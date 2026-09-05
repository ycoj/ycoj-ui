import { getPreliminaryAttempt } from '@/api/server/method/preliminary/attempt';
import { getPreliminaryDetail } from '@/api/server/method/preliminary/detail';
import { getPreliminaryEdit } from '@/api/server/method/preliminary/edit';
import { getPreliminaryList } from '@/api/server/method/preliminary/list';

const Preliminary = {
  getPreliminaryList,
  getPreliminaryDetail,
  getPreliminaryAttempt,
  getPreliminaryEdit,
};

export default Preliminary;
