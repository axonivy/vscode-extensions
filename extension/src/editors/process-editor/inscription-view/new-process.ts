import * as vscode from 'vscode';
import { InscriptionActionHandler, SendInscriptionNotification } from './action-handlers';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';
import { IvyProjectExplorer } from '../../../project-explorer/ivy-project-explorer';

export class NewProcessActionHandler implements InscriptionActionHandler {
  actionId = 'newProcess' as const;
  async handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification): Promise<void> {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (tabInput instanceof vscode.TabInputCustom) {
      await IvyProjectExplorer.instance.addProcess(tabInput.uri, '', actionArgs.context.pid);
      sendInscriptionNotification('dataChanged');
      sendInscriptionNotification('validation');
    }
  }
}
