import { test } from './fixtures/baseTest';

test('Open Engine Cockpit', async ({ page }) => {
  await page.getByRole('treeitem', { name: 'pom.xml', exact: true }).locator('a').click();
  console.log('Hello');
});
