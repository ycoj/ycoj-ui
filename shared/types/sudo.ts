export type BackendError = {
  error: { message: string; name?: string; params?: unknown[] };
};
export type BackendRedirect = { url: string };

/** A POST verification returns replay metadata, not the result of the original action. */
export type SudoResult =
  | BackendRedirect
  | {
      method: string | null;
      redirect: string;
      args: Record<string, unknown>;
    };

export type SudoResponse = SudoResult | BackendError;

export type SudoCredentialType = 'password' | 'tfa' | 'authnChallenge';

export type SudoCapabilities = { authn: boolean; tfa: boolean };
