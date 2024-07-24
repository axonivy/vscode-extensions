import { executeCommand } from '../base/commands';
import { config } from '../base/configurations';
import { ProcessBean } from './api/generated/openapi-dev';
import * as vscode from 'vscode';

export type AnimationFollowMode = 'all' | 'currentProcess' | 'openProcesses' | 'noDialogProcesses' | 'noEmbeddedProcesses';

export const animationSettings = () => {
  return { animate: config.processAnimationAnimate() ?? false, speed: config.processAnimationSpeed() ?? 50 };
};

export const handleOpenEditor = async (process: ProcessBean) => {
  if (!process.uri) {
    return false;
  }
  switch (config.processAnimationMode()) {
    case 'all':
      return openEditor(process);
    case 'currentProcess':
      return isCurrentProcess(process);
    case 'openProcesses':
      if (isOpenProcesses(process)) {
        return openEditor(process);
      }
      return false;
    case 'noDialogProcesses':
      if (process.kind === 'HTML_DIALOG') {
        return false;
      }
      return openEditor(process);
    case 'noEmbeddedProcesses':
      //TODO: check if embedded
      return openEditor(process);
    default:
      return false;
  }
};

const openEditor = async (process: ProcessBean) => {
  if (!process.uri) {
    return false;
  }
  await executeCommand('vscode.open', vscode.Uri.parse(process.uri));
  return true;
};

const isCurrentProcess = (process: ProcessBean) => {
  const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  if (tabInput instanceof vscode.TabInputCustom && process.uri) {
    return tabInput.uri.fsPath === vscode.Uri.parse(process.uri).fsPath;
  }
  return false;
};

const isOpenProcesses = (process: ProcessBean) => {
  if (!process.uri) {
    return false;
  }
  const processUri = vscode.Uri.parse(process.uri);
  return (
    vscode.window.tabGroups.all
      .flatMap(tabGroup => tabGroup.tabs.flatMap(tabs => tabs.input as { uri: vscode.Uri }))
      .filter(input => input && input.uri)
      .filter(input => input.uri.fsPath === processUri.fsPath).length > 0
  );
};
