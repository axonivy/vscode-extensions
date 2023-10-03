import { inject, injectable } from 'inversify';
import { IActionHandler, SModelElement } from '@eclipse-glsp/client';
import { EventStartTypes, QuickAction, SingleQuickActionProvider, StartEventNode } from '@axonivy/process-editor';
import { IvyIcons } from '@axonivy/editor-icons/lib';
import { VsCodeApi } from '@eclipse-glsp/vscode-integration-webview';

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

@injectable()
export class StartProcessActionHandler implements IActionHandler {
  constructor(@inject(VsCodeApi) private vscodeapi: VsCodeApi) {}

  handle(action: StartProcessAction): void {
    this.vscodeapi.postMessage({ command: 'startProcess', processStartUri: action.processStartUri });
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
