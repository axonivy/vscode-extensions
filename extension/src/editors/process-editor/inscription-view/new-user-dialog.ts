import * as vscode from 'vscode';
import { executeCommand } from '../../../base/commands';
import { InscriptionActionHandler, SendInscriptionNotification } from './action-handlers';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';

export class NewHtmlDialogActionHandler implements InscriptionActionHandler {
  actionId = 'newHtmlDialog' as const;
  async handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification) {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (tabInput instanceof vscode.TabInputCustom) {
      await executeCommand('ivyProjects.addNewHtmlDialog', tabInput, [], actionArgs.context.pid);
      sendInscriptionNotification('dataChanged');
      sendInscriptionNotification('validation');
    }
  }
}
