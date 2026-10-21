import { getCSSLanguageService } from 'vscode-css-languageservice/lib/esm/cssLanguageService.js';
import { expect, test } from 'vitest';
import { createEmbeddedCssDocument } from './embedded-css-document';

const source = [
  '<html>',
  '<body>',
  '<style><![CDATA[',
  '.sample {',
  '  color: #c9c8c4;',
  '  ',
  '}',
  ']]></style>',
  '<span style="color: ; width: #{basis / 42 * 100}%;" />',
  '</body>',
  '</html>'
].join('\n');

const cssLanguageService = getCSSLanguageService();

test('creates an offset-preserving CSS document from XHTML regions', () => {
  const cursorOffset = source.indexOf('color') + 2;
  const document = createEmbeddedCssDocument(source, 'file:///test.xhtml', 1, cursorOffset);

  expect(document).toBeDefined();
  expect(document?.getText()).toContain('.sample {');
  expect(document?.getText()).toMatch(/a\{\s*color: ; width:/);
  expect(document?.getText()).not.toContain('<html>');
  expect(document?.getText()).not.toContain('<![CDATA[');
  expect(document?.getText()).not.toContain('#{basis');
  expect(document?.offsetAt(document.positionAt(cursorOffset))).toBe(cursorOffset);
});

test('CSS language service provides hover and inline style value completion', () => {
  const inlineValueOffset = source.indexOf('color: ;') + 'color: '.length;
  const document = createEmbeddedCssDocument(source, 'file:///test.xhtml', 1, inlineValueOffset);
  expect(document).toBeDefined();
  if (!document) {
    return;
  }

  const stylesheet = cssLanguageService.parseStylesheet(document);
  const hoverOffset = source.indexOf('color') + 2;
  const hover = cssLanguageService.doHover(document, document.positionAt(hoverOffset), stylesheet);
  expect(hover).not.toBeNull();

  const completions = cssLanguageService.doComplete(document, document.positionAt(inlineValueOffset), stylesheet);
  expect(completions.items.map(item => item.label)).toContain('red');
});

test('does not create a CSS document outside CSS regions or inside an Ivy expression', () => {
  const expressionOffset = source.indexOf('#{basis') + 4;
  const outsideOffset = source.indexOf('<body>') + 2;

  expect(createEmbeddedCssDocument(source, 'file:///test.xhtml', 1, expressionOffset)).toBeUndefined();
  expect(createEmbeddedCssDocument(source, 'file:///test.xhtml', 1, outsideOffset)).toBeUndefined();
});
