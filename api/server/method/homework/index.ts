import { getHomeworkDetail } from './detail';
import { getHomeworkList } from './list';
import { getHomeworkScoreboard } from './scoreboard';
import { getHomeworkEdit } from '@/api/server/method/homework/edit';

const Homework = {
  getHomeworkList,
  getHomeworkDetail,
  getHomeworkEdit,
  getHomeworkScoreboard,
};

export default Homework;
