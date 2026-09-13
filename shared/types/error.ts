export type HydroError = {
  message?: string;
  params?: unknown[];
  name?: string;
};

export type Errorable<T> =
  | T
  | {
      error: HydroError;
    };
