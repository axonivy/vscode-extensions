import { expect, test, vi } from 'vitest';
import { decreaseWorkspaceLock, increaseWorkspaceLock, isWorkspaceLocked, onWorkspaceUnlocked } from './workspace-lock';

vi.mock('vscode', () => ({
  window: {
    createOutputChannel: () => ({
      appendLine: vi.fn()
    })
  }
}));

test('workspace lock', async () => {
  expect(isWorkspaceLocked()).toBe(true);
  decreaseWorkspaceLock();
  expect(isWorkspaceLocked()).toBe(false);
  decreaseWorkspaceLock();
  expect(isWorkspaceLocked()).toBe(false);

  increaseWorkspaceLock();
  expect(isWorkspaceLocked()).toBe(true);
  increaseWorkspaceLock();
  expect(isWorkspaceLocked()).toBe(true);

  decreaseWorkspaceLock();
  expect(isWorkspaceLocked()).toBe(true);
  decreaseWorkspaceLock();
  expect(isWorkspaceLocked()).toBe(false);
});

test('notify listeners when workspace gets unlocked', async () => {
  const listener = vi.fn();
  onWorkspaceUnlocked(listener);
  increaseWorkspaceLock();
  increaseWorkspaceLock();
  decreaseWorkspaceLock();
  expect(listener).not.toHaveBeenCalled();
  decreaseWorkspaceLock();
  expect(listener).toHaveBeenCalledOnce();
  decreaseWorkspaceLock();
  expect(listener).toHaveBeenCalledOnce();
});
