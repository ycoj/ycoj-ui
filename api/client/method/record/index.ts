import { cancelRecord } from './cancel';
import { getFullRecordList } from './list';
import { rejudgeRecord } from './rejudge';

const Record = {
  cancel: cancelRecord,
  getFullList: getFullRecordList,
  rejudge: rejudgeRecord,
};

export default Record;
