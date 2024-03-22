import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { WebSocketForwarder } from '../websocket-forwarder';
import { MessageParticipant, NotificationType, RequestType } from 'vscode-messenger-common';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { executeCommand } from '../../base/commands';
import { SendInscriptionNotification, handleActionLocal } from './inscription-view/action-handlers';

const ColorThemeChangedNotification: NotificationType<'dark' | 'light'> = { method: 'colorThemeChanged' };
const WebviewConnectionReadyNotification: NotificationType<void> = { method: 'connectionReady' };
const InitializeConnectionRequest: RequestType<void, void> = { method: 'initializeConnection' };
const StartProcessRequest: RequestType<string, void> = { method: 'startProcess' };

const InscriptionWebSocketMessage: NotificationType<unknown> = { method: 'inscriptionWebSocketMessage' };
const IvyScriptWebSocketMessage: NotificationType<unknown> = { method: 'ivyScriptWebSocketMessage' };

export const setupCommunication = (messenger: Messenger, webviewPanel: vscode.WebviewPanel, messageParticipant?: MessageParticipant) => {
  if (messageParticipant === undefined) {
    return;
  }
  const toDispose = new DisposableCollection(
    new InscriptionWebSocketForwarder(messenger, messageParticipant),
    new WebSocketForwarder('ivy-script-lsp', messenger, messageParticipant, IvyScriptWebSocketMessage),
    messenger.onNotification(WebviewConnectionReadyNotification, () => handleWebviewReadyNotification(messenger, messageParticipant), {
      sender: messageParticipant
    }),
    messenger.onRequest(StartProcessRequest, startUri => executeCommand('engine.startProcess', startUri), { sender: messageParticipant }),
    vscode.window.onDidChangeActiveColorTheme(theme =>
      messenger.sendNotification(ColorThemeChangedNotification, messageParticipant, vsCodeThemeToMonacoTheme(theme))
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};

const handleWebviewReadyNotification = async (messenger: Messenger, messageParticipant: MessageParticipant) => {
  await messenger.sendRequest(InitializeConnectionRequest, messageParticipant);
  messenger.sendNotification(ColorThemeChangedNotification, messageParticipant, vsCodeThemeToMonacoTheme(vscode.window.activeColorTheme));
};

const vsCodeThemeToMonacoTheme = (theme: vscode.ColorTheme) => {
  return theme.kind === vscode.ColorThemeKind.Dark || theme.kind === vscode.ColorThemeKind.HighContrast ? 'dark' : 'light';
};

export class InscriptionWebSocketForwarder extends WebSocketForwarder {
  private readonly sendInscriptionNotification: SendInscriptionNotification;

  constructor(messenger: Messenger, messageParticipant: MessageParticipant) {
    super('ivy-inscription-lsp', messenger, messageParticipant, InscriptionWebSocketMessage);
    this.sendInscriptionNotification = (type: string) =>
      this.messenger.sendNotification(this.notificationType, this.messageParticipant, JSON.stringify({ method: type }));
  }

  protected override handleClientMessage(message: unknown) {
    const handled = handleActionLocal(message, this.sendInscriptionNotification);
    if (handled) {
      return;
    }
    super.handleClientMessage(message);
  }
}
