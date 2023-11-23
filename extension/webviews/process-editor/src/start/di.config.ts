import { ContainerModule } from 'inversify';
import { IVY_TYPES } from '@axonivy/process-editor';
import { configureActionHandler } from '@eclipse-glsp/client';
import { StarProcessQuickActionProvider, StartProcessAction, StartProcessActionHandler } from './action';

const ivyStartActionModule = new ContainerModule((bind, _unbind, isBound) => {
  bind(IVY_TYPES.QuickActionProvider).to(StarProcessQuickActionProvider);
  configureActionHandler({ bind, isBound }, StartProcessAction.KIND, StartProcessActionHandler);
});

export default ivyStartActionModule;
