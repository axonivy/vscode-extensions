import { InscriptionActionArgs, InscriptionNotificationTypes } from '@axonivy/inscription-protocol';
import { NewProcessActionHandler } from './project-explorer/new-process';
import { NewHtmlDialogActionHandler } from './project-explorer/new-user-dialog';

export const ActionHandlers = [new NewProcessActionHandler(), new NewHtmlDialogActionHandler()];

export type SendInscriptionNotification = (type: keyof InscriptionNotificationTypes) => void;

export interface InscriptionActionHandler {
  actionId: InscriptionActionArgs['actionId'];
  handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification): Promise<void>;
}
