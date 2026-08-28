declare module 'js-yaml' {
  export function load(input: string): unknown;
  export function dump(
    value: unknown,
    options?: Record<string, unknown>
  ): string;
}
