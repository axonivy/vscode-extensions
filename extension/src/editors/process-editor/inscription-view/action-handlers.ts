import { InscriptionActionArgs, InscriptionNotificationTypes } from '@axonivy/inscription-protocol';
import { OpenPageActionHandler } from './open-page';
import { NewProcessActionHandler } from './new-process';
import { NewHtmlDialogActionHandler } from './new-user-dialog';

const ActionHandlers = [new NewProcessActionHandler(), new NewHtmlDialogActionHandler(), new OpenPageActionHandler()];

export type SendInscriptionNotification = (type: keyof InscriptionNotificationTypes) => void;

export interface InscriptionActionHandler {
  actionId: InscriptionActionArgs['actionId'];
  handle(actionArgs: InscriptionActionArgs, sendInscriptionNotification: SendInscriptionNotification): Promise<void>;
}

export const handleActionLocal = (msg: unknown, sendInscriptionNotification: SendInscriptionNotification) => {
  if (isAction(msg)) {
    const handler = ActionHandlers.find(handler => handler.actionId === msg.params.actionId);
    if (handler) {
      handler.handle(msg.params, sendInscriptionNotification);
      return true;
    }
  }
  return false;
};

const isAction = (obj: unknown): obj is { method: string; params: InscriptionActionArgs } => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'method' in obj &&
    obj.method === 'action' &&
    'params' in obj &&
    typeof obj.params === 'object'
  );
};
