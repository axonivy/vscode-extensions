import { injectable, inject } from 'inversify';
import { Action } from '@eclipse-glsp/client';
import { OpenAction } from 'sprotty-protocol';
import { VsCodeApi } from 'sprotty-vscode-webview/lib/services';

export function isInvokeOpenAction(action: Action): action is OpenAction {
  return action.kind === OpenInscriptionAction.KIND;
}

@injectable()
export class OpenInscriptionActionHandler {
  @inject(VsCodeApi)
  protected vscodeApi: VsCodeApi;

  handle(action: Action): void {
    if (isInvokeOpenAction(action)) {
      this.vscodeApi.postMessage(OpenInscriptionAction.create());
    }
  }
}

export interface OpenInscriptionAction extends Action {
  kind: typeof OpenInscriptionAction.KIND;
}

export namespace OpenInscriptionAction {
  export const KIND = 'openInscription';

  export function create(): OpenInscriptionAction {
    return { kind: KIND };
  }
}
