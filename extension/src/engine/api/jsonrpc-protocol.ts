import type { Disposable } from '@axonivy/jsonrpc';
import { ProcessBean } from './generated/openapi-dev';

export class Callback<T, R = void> implements Disposable {
  private callback?: (e: T) => R;

  set(callback: (e: T) => R) {
    this.callback = callback;
  }

  call(e: T) {
    return this.callback?.(e);
  }

  dispose() {
    this.callback = undefined;
  }
}

export interface WebIdeClient {
  onOpenEditor: Callback<ProcessBean, Promise<boolean>>;
  animationSettings(settings: AnimationSettings): void;

  stop(): void;
}

export type AnimationSettings = {
  animate: boolean;
  speed: number;
};
