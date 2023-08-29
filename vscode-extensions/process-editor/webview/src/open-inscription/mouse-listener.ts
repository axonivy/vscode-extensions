import { OpenInscriptionAction } from '@axonivy/process-editor-protocol';
import { findParentByFeature, isOpenable, MouseListener, SModelElement } from '@eclipse-glsp/client';
import { Action } from '@eclipse-glsp/protocol';

export class OpenInscriptionMouseListener extends MouseListener {
  override doubleClick(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
    const element = findParentByFeature(target, isOpenable);
    if (element) {
      return [OpenInscriptionAction.create(element.id)];
    }
    return [];
  }
}
