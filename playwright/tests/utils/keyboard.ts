export function getCtrlOrMeta(): string {
  if (process.platform === 'darwin') {
    return 'Meta';
  }
  return 'Control';
}
