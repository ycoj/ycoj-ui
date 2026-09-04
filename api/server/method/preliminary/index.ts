import { getPreliminaryAttempt } from '@/api/server/method/preliminary/attempt';
import { getPreliminaryDetail } from '@/api/server/method/preliminary/detail';
import {
  getPreliminaryCreate,
  getPreliminaryEdit,
} from '@/api/server/method/preliminary/edit';
import { getPreliminaryList } from '@/api/server/method/preliminary/list';

const Preliminary = {
  getPreliminaryList,
  getPreliminaryDetail,
  getPreliminaryAttempt,
  getPreliminaryCreate,
  getPreliminaryEdit,
};

export default Preliminary;
