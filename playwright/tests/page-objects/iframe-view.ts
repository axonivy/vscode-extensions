import { FrameLocator } from '@playwright/test';
import { View } from './view';

export class IFrameView extends View {
  protected viewFrameLoactor(): FrameLocator {
    return this.viewLocator.frameLocator('iFrame').frameLocator('iFrame');
  }
}
