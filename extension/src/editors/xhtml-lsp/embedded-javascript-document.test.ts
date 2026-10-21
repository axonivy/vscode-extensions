import { expect, test } from 'vitest';
import { createEmbeddedJavascriptDocument } from './embedded-javascript-document';

const source = [
  '<!DOCTYPE html>',
  '<html>',
  '<body>',
  '<style><![CDATA[.sample { color: red; }]]></style>',
  '<script><![CDATA[',
  '  const sample = document.getElementById("sample");',
  '  #{ivyWorkflowView.value}',
  '  sample?.focus();',
  ']]></script>',
  '</body>',
  '</html>'
].join('\n');

test('creates a position-preserving JavaScript document for script blocks', () => {
  const cursorOffset = source.indexOf('sample?.focus') + 10;
  const javascript = createEmbeddedJavascriptDocument(source, cursorOffset);

  expect(javascript).toBeDefined();
  expect(javascript?.text).toContain('// @ts-nocheck');
  expect(javascript?.text).toContain('sample?.focus();');
  expect(javascript?.text).not.toContain('<html>');
  expect(javascript?.text).not.toContain('<![CDATA[');
  expect(javascript?.text).not.toContain('#{ivyWorkflowView');
  expect(javascript?.text.length).toBe(source.length);
  expect(javascript?.text.slice(javascript.region.start, javascript.region.end)).toContain('sample?.focus();');
});

test('does not create a JavaScript document outside script blocks or inside Ivy expressions', () => {
  const expressionOffset = source.indexOf('#{ivyWorkflowView') + 4;
  const htmlOffset = source.indexOf('<body>') + 2;

  expect(createEmbeddedJavascriptDocument(source, expressionOffset)).toBeUndefined();
  expect(createEmbeddedJavascriptDocument(source, htmlOffset)).toBeUndefined();
});
