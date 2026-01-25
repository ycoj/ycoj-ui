export type HydroError = {
  message: string;
  params?: string[];
  name: string;
};

export type Errorable<T> =
  | T
  | {
      error: HydroError;
    };
