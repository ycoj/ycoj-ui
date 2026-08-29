type SelectAllHotkeyEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
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
