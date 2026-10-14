import { expect, test } from '~/fixtures/baseTest';
import { screenshotLocator } from './screenshot-util';

test('market install wizard', async ({ wsPage }) => {
  await wsPage.executeCommand('Axon Ivy: Install Market Product');
  const input = wsPage.quickInputBox.getByRole('textbox');
  await expect(wsPage.quickInputList).toBeVisible();
  await expect(wsPage.quickInputListEntry.nth(4)).toBeVisible();
  await screenshotLocator(wsPage.page, wsPage.quickInputWidget, 'market-install-product-search');
  await input.fill('Microsoft 365');
  await input.press('Enter', { delay: 100 });

  await expect(wsPage.quickInputBox).toBeVisible();
  const versionInput = wsPage.quickInputBox.getByRole('textbox');
  await versionInput.fill('');
  await screenshotLocator(wsPage.page, wsPage.quickInputWidget, 'market-install-version-selection');
  await versionInput.fill('14.0.0');
  await versionInput.press('Enter', { delay: 100 });

  const projectSelection = wsPage.page.locator('div.quick-input-header');
  await expect(projectSelection.getByRole('checkbox', { name: 'Toggle all checkboxes' })).toBeVisible();
  await screenshotLocator(wsPage.page, wsPage.quickInputWidget, 'market-install-project-selection');
});
