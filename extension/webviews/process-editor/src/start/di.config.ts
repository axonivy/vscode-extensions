import { FeatureModule, configureActionHandler } from '@eclipse-glsp/client';
import { IVY_TYPES } from '@axonivy/process-editor';
import { StarProcessQuickActionProvider, StartProcessAction, StartProcessActionHandler } from './action';

const ivyStartActionModule = new FeatureModule((bind, _unbind, isBound) => {
  bind(IVY_TYPES.QuickActionProvider).to(StarProcessQuickActionProvider);
  configureActionHandler({ bind, isBound }, StartProcessAction.KIND, StartProcessActionHandler);
});

export default ivyStartActionModule;
