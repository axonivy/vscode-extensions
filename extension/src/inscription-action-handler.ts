import { InscriptionActionArgs } from '@axonivy/inscription-protocol';
import { NewProcessActionHandler } from './project-explorer/new-process';
import { NewHtmlDialogActionHandler } from './project-explorer/new-user-dialog';

export const ActionHandlers = [new NewProcessActionHandler(), new NewHtmlDialogActionHandler()];

export interface InscriptionActionHandler {
  actionId: InscriptionActionArgs['actionId'];
  handle(actionArgs: InscriptionActionArgs): void;
}
