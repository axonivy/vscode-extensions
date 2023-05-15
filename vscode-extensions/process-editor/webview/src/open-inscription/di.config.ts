import { ContainerModule } from 'inversify';
import { configureActionHandler, TYPES } from '@eclipse-glsp/client';
import { OpenInscriptionMouseListener } from './mouse-listener';
import { OpenInscriptionAction, OpenInscriptionActionHandler } from './open-inscription-handler';
import { IVY_TYPES } from '@axonivy/process-editor';
import { InscribeQuickActionProvider } from './quick-action';
import { OpenInscriptionKeyListener } from './key-listener';

const ivyOpenInscriptionModule = new ContainerModule((bind, _unbind, isBound) => {
  configureActionHandler({ bind, isBound }, OpenInscriptionAction.KIND, OpenInscriptionActionHandler);
  bind(TYPES.MouseListener).to(OpenInscriptionMouseListener);
  bind(IVY_TYPES.QuickActionProvider).to(InscribeQuickActionProvider);
  bind(TYPES.KeyListener).to(OpenInscriptionKeyListener);
});

export default ivyOpenInscriptionModule;
