import { Entry } from './ivy-project-tree-data-provider';

export function getCmdEntry(selectedEntries: readonly Entry[], entry?: Entry): Entry | undefined {
  if (entry) {
    return entry;
  }
  if (selectedEntries.length > 0) {
    return selectedEntries[0] as Entry;
  }
  return undefined;
}
