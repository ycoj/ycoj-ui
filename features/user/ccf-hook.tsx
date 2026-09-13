import Image from 'next/image';

type Props = {
  level?: number;
};

function getHookImage(level: number): string | null {
  if (level >= 9) return '/ccf-hook-gold.png';
  if (level >= 6) return '/ccf-hook-blue.png';
  if (level >= 3) return '/ccf-hook-green.png';
  return null;
}

export default function CcfHook({ level = 0 }: Props) {
  const src = getHookImage(level);
  if (!src) return null;

  return (
    <Image
      src={src}
      width={16}
      height={16}
      alt={`CCF ${level}`}
      title={`CCF ${level}`}
      className="inline-block shrink-0 align-middle"
    />
  );
}
