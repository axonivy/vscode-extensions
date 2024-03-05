import { InscriptionActionArgs, InscriptionNotificationTypes } from '@axonivy/inscription-protocol';
import { NewProcessActionHandler } from './project-explorer/new-process';
import { NewHtmlDialogActionHandler } from './project-explorer/new-user-dialog';
import { OpenPageActionHandler } from './inscription-view/open-page';

export const ActionHandlers = [new NewProcessActionHandler(), new NewHtmlDialogActionHandler(), new OpenPageActionHandler()];

export type SendInscriptionNotification = (type: keyof InscriptionNotificationTypes) => void;

export interface InscriptionActionHandler {
  actionId: InscriptionActionArgs['actionId'];
  handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification): Promise<void>;
}
