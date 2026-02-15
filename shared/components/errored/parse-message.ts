import { HydroError } from '@/shared/types/error';

export default function parseErrorMessage(err: string | HydroError) {
  if (typeof err === 'string') {
    return err;
  }

  if (err.params) {
    return err.message.replace(/{(\d+)}/g, (match, p1) => err.params![p1]);
  }
  return err.message;
}
