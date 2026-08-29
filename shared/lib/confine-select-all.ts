type SelectAllHotkeyEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

type ConfineSelectAllKeyDownEvent = SelectAllHotkeyEvent & {
  preventDefault: () => void;
  currentTarget: Element;
};

export function isSelectAllHotkey(event: SelectAllHotkeyEvent): boolean {
  return (
    event.key.toLowerCase() === 'a' &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}

export function selectElementContents(element: Element): void {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function confineSelectAllOnKeyDown(
  event: ConfineSelectAllKeyDownEvent
): void {
  if (!isSelectAllHotkey(event)) return;
  event.preventDefault();
  selectElementContents(event.currentTarget);
}
