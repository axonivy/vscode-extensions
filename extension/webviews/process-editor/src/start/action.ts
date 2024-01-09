import { inject, injectable } from 'inversify';
import { IActionHandler, SModelElement } from '@eclipse-glsp/client';
import { EventStartTypes, QuickAction, SingleQuickActionProvider, StartEventNode } from '@axonivy/process-editor';
import { IvyIcons } from '@axonivy/editor-icons';
import { HOST_EXTENSION, RequestType } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';

export interface StartProcessAction {
  kind: typeof StartProcessAction.KIND;
  elementId: string;
  processStartUri: string;
}

export namespace StartProcessAction {
  export const KIND = 'startProcess';

  export function create(elementId: string, processStartUri: string): StartProcessAction {
    return {
      kind: KIND,
      elementId,
      processStartUri
    };
  }
}

const StartProcessRequest: RequestType<string, void> = { method: 'startProcess' };

@injectable()
export class StartProcessActionHandler implements IActionHandler {
  constructor(@inject(Messenger) private messenger: Messenger) {}

  handle(action: StartProcessAction) {
    this.messenger.sendRequest(StartProcessRequest, HOST_EXTENSION, action.processStartUri);
  }
}

@injectable()
export class StarProcessQuickActionProvider extends SingleQuickActionProvider {
  singleQuickAction(element: SModelElement): QuickAction | undefined {
    if (element instanceof StartEventNode && element.type === EventStartTypes.START) {
      const processStartUri = (element.args['processStartUri'] as string) ?? '';
      return {
        icon: IvyIcons.Play,
        title: 'Start Process (X)',
        location: 'Left',
        sorting: 'A',
        action: StartProcessAction.create(element.id, processStartUri),
        readonlySupport: true,
        shortcut: 'KeyX',
        removeSelection: true
      };
    }
    return undefined;
  }
}
