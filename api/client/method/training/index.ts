import { createTraining } from '@/api/client/method/training/create';
import { deleteTraining } from '@/api/client/method/training/delete';
import { editTraining } from '@/api/client/method/training/edit';
import { enrollTraining } from '@/api/client/method/training/enroll';

const Training = {
  createTraining,
  deleteTraining,
  editTraining,
  enrollTraining,
};

export default Training;
