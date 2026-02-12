declare module 'katex/contrib/auto-render' {
  type Delimiter = {
    left: string;
    right: string;
    display: boolean;
  };

  type AutoRenderOptions = {
    delimiters?: Delimiter[];
    ignoredTags?: string[];
    throwOnError?: boolean;
  };

  const renderMathInElement: (
    element: HTMLElement,
    options?: AutoRenderOptions
  ) => void;

  export default renderMathInElement;
}
