import { getTrainingDetail } from '@/api/server/method/training/detail';
import { getTrainingEdit } from '@/api/server/method/training/edit';
import { getTrainingList } from '@/api/server/method/training/list';

const Training = {
  getTrainingDetail,
  getTrainingEdit,
  getTrainingList,
};

export default Training;
