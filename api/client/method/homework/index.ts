import { createHomework } from './create';
import { attendHomework } from './registration';
import {
  deleteHomework,
  editHomework,
} from '@/api/client/method/homework/edit';

const Homework = {
  createHomework,
  editHomework,
  deleteHomework,
  attendHomework,
};

export default Homework;
