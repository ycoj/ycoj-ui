import { createHomework } from './create';
import { attendHomework } from './registration';
import { editHomework } from '@/api/client/method/homework/edit';

const Homework = {
  createHomework,
  editHomework,
  attendHomework,
};

export default Homework;
