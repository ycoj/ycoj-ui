type timeUnits = 'ms' | 's' | 'min';

export function formatTime(
  timeInMs: number,
  unit: timeUnits | 'auto' = 'auto'
) {
  if (!Number.isFinite(timeInMs)) return '-';

  const totalMs = Math.round(timeInMs);

  if (unit === 'ms') return `${totalMs}ms`;
  if (unit === 's') return `${toFixedOneDecimal(totalMs / 1000)}s`;
  if (unit === 'min') return `${toFixedOneDecimal(totalMs / 60_000)}min`;

  if (totalMs >= 60_000) return `${Math.floor(totalMs / 60_000)}min`;
  if (totalMs >= 1000) return `${Math.floor(totalMs / 1000)}s`;
  return `${totalMs}ms`;
}

type memoryUnits = 'B' | 'KiB' | 'MiB' | 'GiB';

export function formatMemory(
  memoryInBytes: number,
  unit: memoryUnits | 'auto' = 'auto'
) {
  if (!Number.isFinite(memoryInBytes)) return '-';

  const totalB = Math.round(memoryInBytes);

  if (unit !== 'auto') {
    const factor = memoryUnitToFactor(unit);
    return `${toFixedOneDecimal(totalB / factor)}${unit}`;
  }

  if (totalB >= 1024 ** 3) return `${Math.floor(totalB / 1024 ** 3)}GiB`;
  if (totalB >= 1024 ** 2) return `${Math.floor(totalB / 1024 ** 2)}MiB`;
  if (totalB >= 1024) return `${Math.floor(totalB / 1024)}KiB`;
  return `${totalB}B`;
}

function toFixedOneDecimal(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return rounded.toFixed(1);
}

function memoryUnitToFactor(unit: memoryUnits) {
  if (unit === 'B') return 1;
  if (unit === 'KiB') return 1024;
  if (unit === 'MiB') return 1024 ** 2;
  return 1024 ** 3;
}
