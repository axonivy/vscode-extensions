import { getLanguageService } from 'vscode-html-languageservice/lib/esm/htmlLanguageService.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { expect, test } from 'vitest';

test('HTML language service formats an XHTML document with namespaced tags', () => {
  const source = '<html xmlns="http://www.w3.org/1999/xhtml"><h:body><h:form><span>value</span></h:form></h:body></html>';
  const document = TextDocument.create('file:///test.xhtml', 'html', 1, source);
  const htmlLanguageService = getLanguageService();
  const edits = htmlLanguageService.format(document, undefined, { tabSize: 2, insertSpaces: true });
  const formatted = TextDocument.applyEdits(document, edits);

  expect(formatted).toContain('<h:body>');
  expect(formatted).toContain('\n');
  expect(formatted).not.toBe(source);
});
