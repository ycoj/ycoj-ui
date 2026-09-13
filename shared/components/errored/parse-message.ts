import { HydroError } from '@/shared/types/error';

export default function parseErrorMessage(err: string | HydroError) {
  if (typeof err === 'string') {
    return err;
  }

  const { message, name, params } = err;
  if (params && message) {
    return message.replace(/{(\d+)}/g, (match, p1) =>
      String(params[Number(p1)] ?? match)
    );
  }
  return message || name || 'Error';
}
