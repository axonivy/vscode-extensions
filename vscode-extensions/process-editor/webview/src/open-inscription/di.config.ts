import { ContainerModule } from 'inversify';
import { TYPES } from '@eclipse-glsp/client';
import { OpenInscriptionMouseListener } from './mouse-listener';
import { IVY_TYPES } from '@axonivy/process-editor';
import { InscribeQuickActionProvider } from './quick-action';
import { OpenInscriptionKeyListener } from './key-listener';

const ivyOpenInscriptionModule = new ContainerModule((bind, _unbind, isBound) => {
  bind(TYPES.MouseListener).to(OpenInscriptionMouseListener);
  bind(IVY_TYPES.QuickActionProvider).to(InscribeQuickActionProvider);
  bind(TYPES.KeyListener).to(OpenInscriptionKeyListener);
});

export default ivyOpenInscriptionModule;
