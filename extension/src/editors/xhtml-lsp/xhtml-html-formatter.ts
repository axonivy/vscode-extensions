import { Position, Range, TextEdit, workspace, type FormattingOptions, type TextDocument } from 'vscode';
import { getLanguageService, type HTMLFormatConfiguration } from 'vscode-html-languageservice/lib/esm/htmlLanguageService.js';
import { TextDocument as LspTextDocument } from 'vscode-languageserver-textdocument';

const htmlLanguageService = getLanguageService();

export const formatXhtmlWithHtmlLanguageService = (
  document: TextDocument,
  formattingOptions: FormattingOptions,
  range?: Range
) => {
  const htmlConfiguration = workspace.getConfiguration('html', document.uri);
  if (!htmlConfiguration.get<boolean>('format.enable', true)) {
    return [];
  }

  const contentUnformatted = htmlConfiguration.get<string | null>('format.contentUnformatted', 'pre,code,textarea');
  const formatConfiguration: HTMLFormatConfiguration = {
    tabSize: formattingOptions.tabSize,
    insertSpaces: formattingOptions.insertSpaces,
    wrapLineLength: htmlConfiguration.get<number>('format.wrapLineLength', 120),
    unformatted: htmlConfiguration.get<string | null>('format.unformatted', 'wbr') ?? undefined,
    contentUnformatted: contentUnformatted ? `${contentUnformatted},script` : 'script',
    indentInnerHtml: htmlConfiguration.get<boolean>('format.indentInnerHtml', false),
    preserveNewLines: htmlConfiguration.get<boolean>('format.preserveNewLines', true),
    maxPreserveNewLines: htmlConfiguration.get<number | null>('format.maxPreserveNewLines', null) ?? undefined,
    extraLiners: htmlConfiguration.get<string | null>('format.extraLiners', 'head, body, /html') ?? undefined,
    indentHandlebars: htmlConfiguration.get<boolean>('format.indentHandlebars', false),
    wrapAttributes: htmlConfiguration.get<HTMLFormatConfiguration['wrapAttributes']>('format.wrapAttributes', 'auto'),
    wrapAttributesIndentSize: htmlConfiguration.get<number | null>('format.wrapAttributesIndentSize', null) ?? undefined,
    templating: htmlConfiguration.get<boolean>('format.templating', false),
    unformattedContentDelimiter: htmlConfiguration.get<string>('format.unformattedContentDelimiter', '')
  };

  const htmlDocument = LspTextDocument.create(document.uri.toString(), 'html', document.version, document.getText());
  return htmlLanguageService
    .format(htmlDocument, range ? toLspRange(range) : undefined, formatConfiguration)
    .map(edit => TextEdit.replace(toVscodeRange(edit.range), edit.newText));
};

const toLspRange = (range: Range) => ({
  start: { line: range.start.line, character: range.start.character },
  end: { line: range.end.line, character: range.end.character }
});

const toVscodeRange = (range: { start: { line: number; character: number }; end: { line: number; character: number } }) =>
  new Range(new Position(range.start.line, range.start.character), new Position(range.end.line, range.end.character));
