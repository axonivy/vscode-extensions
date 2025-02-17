import { test } from './fixtures/baseTest';

test('Open Engine Cockpit', async ({ page }) => {
  await page.getByRole('treeitem', { name: 'pom.xml', exact: true }).locator('axxx').click();
  console.log('Hello');
});
