import { Action, isOpenable, isSelectable, KeyListener, SModelElement } from '@eclipse-glsp/client';
import { toArray } from 'sprotty/lib/utils/iterable';
import { matchesKeystroke } from 'sprotty/lib/utils/keyboard';
import { OpenInscriptionAction } from './open-inscription-handler';

export class OpenInscriptionKeyListener extends KeyListener {
  override keyDown(element: SModelElement, event: KeyboardEvent): Action[] {
    if (matchesKeystroke(event, 'Enter')) {
      const openableElements = this.getOpenableElements(element);
      if (openableElements.length === 1) {
        return [OpenInscriptionAction.create()];
      }
    }
    return [];
  }

  private getOpenableElements(element: SModelElement): SModelElement[] {
    return toArray(
      element.index
        .all()
        .filter(e => isSelectable(e) && e.selected)
        .filter(e => isOpenable(e))
    );
  }
}
