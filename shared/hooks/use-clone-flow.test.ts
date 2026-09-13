import { useCloneFlow } from './use-clone-flow';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

type Source = {
  id: number;
  title: string;
  content: string;
};

type CloneValues = {
  title: string;
  content: string;
};

const source: Source = { id: 1, title: 'original', content: 'body' };
const patch: CloneValues = { title: 'renamed', content: 'body' };

const toCloneValues = (values: Source): CloneValues => ({
  title: values.title,
  content: values.content,
});

function renderCloneFlow(onClone?: (values: Source) => Promise<string>) {
  return renderHook(() =>
    useCloneFlow<Source, CloneValues>({ onClone, toCloneValues })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCloneFlow', () => {
  it('keeps cloneValues undefined until openCloneDialog is called', () => {
    const onClone = vi.fn<(values: Source) => Promise<string>>();
    const { result } = renderCloneFlow(onClone);
    expect(result.current.cloneValues).toBeUndefined();

    act(() => {
      result.current.openCloneDialog(source);
    });
    expect(result.current.cloneValues).toEqual(toCloneValues(source));
  });

  it('confirms a clone by merging the patch over the source and navigating', async () => {
    const onClone = vi
      .fn<(values: Source) => Promise<string>>()
      .mockResolvedValue('/next');
    const { result } = renderCloneFlow(onClone);
    act(() => {
      result.current.openCloneDialog(source);
    });

    await act(async () => {
      await result.current.confirmClone(patch);
    });

    expect(onClone).toHaveBeenCalledWith({
      id: 1,
      title: 'renamed',
      content: 'body',
    });
    expect(mocks.push).toHaveBeenCalledWith('/next');
    expect(mocks.refresh).toHaveBeenCalled();
    expect(result.current.cloneValues).toBeUndefined();
  });

  it('ignores confirmClone without a previously opened dialog', async () => {
    const onClone = vi
      .fn<(values: Source) => Promise<string>>()
      .mockResolvedValue('/next');
    const { result } = renderCloneFlow(onClone);

    await act(async () => {
      await result.current.confirmClone(patch);
    });

    expect(onClone).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(result.current.cloneValues).toBeUndefined();
  });

  it('ignores open and confirm when onClone is not provided', async () => {
    const { result } = renderCloneFlow();

    act(() => {
      result.current.openCloneDialog(source);
    });
    expect(result.current.cloneValues).toBeUndefined();

    await act(async () => {
      await result.current.confirmClone(patch);
    });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('keeps the dialog open without navigating when onClone rejects', async () => {
    const onClone = vi
      .fn<(values: Source) => Promise<string>>()
      .mockRejectedValue(new Error('failed'));
    const { result } = renderCloneFlow(onClone);
    act(() => {
      result.current.openCloneDialog(source);
    });

    await act(async () => {
      await expect(result.current.confirmClone(patch)).rejects.toThrow(
        'failed'
      );
    });

    expect(result.current.cloneValues).toEqual(toCloneValues(source));
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('clears the dialog state when closing without confirming', () => {
    const onClone = vi.fn<(values: Source) => Promise<string>>();
    const { result } = renderCloneFlow(onClone);
    act(() => {
      result.current.openCloneDialog(source);
    });
    expect(result.current.cloneValues).toEqual(toCloneValues(source));

    act(() => {
      result.current.closeCloneDialog();
    });
    expect(result.current.cloneValues).toBeUndefined();
  });
});
