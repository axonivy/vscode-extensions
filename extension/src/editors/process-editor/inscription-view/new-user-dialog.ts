import * as vscode from 'vscode';
import { executeCommand } from '../../../base/commands';
import { InscriptionActionHandler, SendInscriptionNotification } from './action-handlers';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';
import { DialogType, dialogTypes } from '../../../project-explorer/new-user-dialog';

export class NewHtmlDialogActionHandler implements InscriptionActionHandler {
  actionId = 'newHtmlDialog' as const;
  async handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification) {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (!(tabInput instanceof vscode.TabInputCustom)) {
      return;
    }
    const dialogType = await this.collectDialogType();
    if (!dialogType) {
      return;
    }
    const command = this.dialogTypeToCommand(dialogType);
    await executeCommand(command, tabInput, [], actionArgs.context.pid);
    sendInscriptionNotification('dataChanged');
    sendInscriptionNotification('validation');
  }

  private collectDialogType(): Promise<DialogType | undefined> {
    return vscode.window.showQuickPick(dialogTypes, {
      title: 'Select Dialog Type',
      ignoreFocusOut: true
    }) as Promise<DialogType | undefined>;
  }

  private dialogTypeToCommand(dialogType: DialogType) {
    if (dialogType === 'Form') {
      return 'ivyProjects.addNewFormDialog';
    }
    if (dialogType === 'JSF') {
      return 'ivyProjects.addNewHtmlDialog';
    }
    return 'ivyProjects.addNewOfflineDialog';
  }
}
