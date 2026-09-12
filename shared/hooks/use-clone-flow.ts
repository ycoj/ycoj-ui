import { useRouter } from 'next/navigation';
import { useState } from 'react';

type UseCloneFlowOptions<TSource, TCloneValues> = {
  onClone?: (values: TSource) => Promise<string>;
  toCloneValues: (source: TSource) => TCloneValues;
};

export function useCloneFlow<TSource, TCloneValues>({
  onClone,
  toCloneValues,
}: UseCloneFlowOptions<TSource, TCloneValues>) {
  const router = useRouter();
  const [source, setSource] = useState<TSource>();

  const openCloneDialog = (values: TSource) => {
    if (!onClone) return;
    setSource(values);
  };

  const closeCloneDialog = () => {
    setSource(undefined);
  };

  const confirmClone = async (patch: TCloneValues) => {
    if (!onClone || !source) return;
    const path = await onClone({ ...source, ...patch });
    setSource(undefined);
    router.push(path);
    router.refresh();
  };

  return {
    cloneValues: source ? toCloneValues(source) : undefined,
    openCloneDialog,
    closeCloneDialog,
    confirmClone,
  };
}
