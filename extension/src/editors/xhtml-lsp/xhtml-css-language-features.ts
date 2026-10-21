import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  Color as VscodeColor,
  ColorInformation as VscodeColorInformation,
  ColorPresentation as VscodeColorPresentation,
  Hover,
  MarkdownString,
  Position,
  Range,
  SnippetString,
  TextEdit,
  languages,
  type CompletionItemProvider,
  type DocumentColorProvider,
  type ExtensionContext,
  type HoverProvider,
  type TextDocument as VscodeTextDocument
} from 'vscode';
import {
  getCSSLanguageService,
  InsertTextFormat,
  type Color as CssColor,
  type CompletionItem as CssCompletionItem,
  type Hover as CssHover,
  type MarkedString,
  type MarkupContent
} from 'vscode-css-languageservice/lib/esm/cssLanguageService.js';
import { createEmbeddedCssDocument, createEmbeddedCssDocumentForDocument } from './embedded-css-document';

const cssLanguageService = getCSSLanguageService();
cssLanguageService.configure({ hover: { documentation: true, references: true } });

class XhtmlCssLanguageFeatures implements CompletionItemProvider, HoverProvider, DocumentColorProvider {
  provideCompletionItems(document: VscodeTextDocument, position: Position) {
    const embeddedDocument = createEmbeddedCssDocument(
      document.getText(),
      document.uri.toString(),
      document.version,
      document.offsetAt(position)
    );
    if (!embeddedDocument) {
      return;
    }

    const stylesheet = cssLanguageService.parseStylesheet(embeddedDocument);
    const completions = cssLanguageService.doComplete(embeddedDocument, position, stylesheet);
    return new CompletionList(completions.items.map(toVscodeCompletionItem), completions.isIncomplete);
  }

  provideHover(document: VscodeTextDocument, position: Position) {
    const embeddedDocument = createEmbeddedCssDocument(
      document.getText(),
      document.uri.toString(),
      document.version,
      document.offsetAt(position)
    );
    if (!embeddedDocument) {
      return;
    }

    const stylesheet = cssLanguageService.parseStylesheet(embeddedDocument);
    const hover = cssLanguageService.doHover(embeddedDocument, position, stylesheet);
    return hover ? toVscodeHover(hover) : undefined;
  }

  provideDocumentColors(document: VscodeTextDocument) {
    const embeddedCss = createEmbeddedCssDocumentForDocument(document.getText(), document.uri.toString(), document.version);
    if (!embeddedCss) {
      return [];
    }

    const stylesheet = cssLanguageService.parseStylesheet(embeddedCss.document);
    return cssLanguageService
      .findDocumentColors(embeddedCss.document, stylesheet)
      .filter(color => isRangeWithinEmbeddedCss(document, color.range, embeddedCss.regions))
      .map(color =>
        new VscodeColorInformation(
          toVscodeRange(color.range),
          new VscodeColor(color.color.red, color.color.green, color.color.blue, color.color.alpha)
        )
      );
  }

  provideColorPresentations(color: VscodeColor, context: { document: VscodeTextDocument; range: Range }) {
    const { document, range } = context;
    const embeddedDocument = createEmbeddedCssDocument(
      document.getText(),
      document.uri.toString(),
      document.version,
      document.offsetAt(range.start)
    );
    if (!embeddedDocument) {
      return [];
    }

    const stylesheet = cssLanguageService.parseStylesheet(embeddedDocument);
    const cssColor: CssColor = { red: color.red, green: color.green, blue: color.blue, alpha: color.alpha };
    const presentations = cssLanguageService.getColorPresentations(
      embeddedDocument,
      stylesheet,
      cssColor,
      toCssRange(range)
    );
    return presentations.map(presentation => {
      const result = new VscodeColorPresentation(presentation.label);
      if (presentation.textEdit) {
        result.textEdit = TextEdit.replace(toVscodeRange(presentation.textEdit.range), presentation.textEdit.newText);
      }
      if (presentation.additionalTextEdits) {
        result.additionalTextEdits = presentation.additionalTextEdits.map(edit =>
          TextEdit.replace(toVscodeRange(edit.range), edit.newText)
        );
      }
      return result;
    });
  }
}

export const registerXhtmlCssLanguageFeatures = (context: ExtensionContext) => {
  const selector = { language: 'ivy-xhtml', scheme: 'file' };
  const provider = new XhtmlCssLanguageFeatures();
  context.subscriptions.push(
    languages.registerCompletionItemProvider(selector, provider, ':', '-', ' ', ';', '(', '#'),
    languages.registerHoverProvider(selector, provider),
    languages.registerColorProvider(selector, provider)
  );
};

const isRangeWithinEmbeddedCss = (
  document: VscodeTextDocument,
  range: { start: { line: number; character: number }; end: { line: number; character: number } },
  regions: Array<{ start: number; end: number }>
) => {
  const start = document.offsetAt(new Position(range.start.line, range.start.character));
  const end = document.offsetAt(new Position(range.end.line, range.end.character));
  return regions.some(region => start >= region.start && end <= region.end);
};

const toVscodeCompletionItem = (cssItem: CssCompletionItem) => {
  const kind = cssItem.kind === undefined ? undefined : (cssItem.kind - 1) as CompletionItemKind;
  const item = new CompletionItem(cssItem.label, kind);
  item.detail = cssItem.detail;
  item.documentation = toMarkdownString(cssItem.documentation);
  item.filterText = cssItem.filterText;
  item.sortText = cssItem.sortText;
  item.preselect = cssItem.preselect;
  item.commitCharacters = cssItem.commitCharacters;

  if (cssItem.textEdit) {
    item.range =
      'range' in cssItem.textEdit
        ? toVscodeRange(cssItem.textEdit.range)
        : {
            inserting: toVscodeRange(cssItem.textEdit.insert),
            replacing: toVscodeRange(cssItem.textEdit.replace)
          };
    item.insertText = toInsertText(cssItem.textEdit.newText, cssItem.insertTextFormat);
  } else if (cssItem.insertText) {
    item.insertText = toInsertText(cssItem.insertText, cssItem.insertTextFormat);
  }

  if (cssItem.additionalTextEdits) {
    item.additionalTextEdits = cssItem.additionalTextEdits.map(edit =>
      TextEdit.replace(toVscodeRange(edit.range), edit.newText)
    );
  }

  if (cssItem.command) {
    item.command = cssItem.command;
  }
  return item;
};

const toInsertText = (text: string, format: number | undefined) =>
  format === InsertTextFormat.Snippet ? new SnippetString(text) : text;

const toVscodeHover = (cssHover: CssHover) => {
  const range = cssHover.range ? toVscodeRange(cssHover.range) : undefined;
  const contents = toMarkdownString(cssHover.contents);
  return contents === undefined ? undefined : new Hover(contents, range);
};

const toMarkdownString = (content: string | MarkupContent | MarkedString | MarkedString[] | undefined) => {
  if (!content) {
    return undefined;
  }
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content) && 'kind' in content) {
    return content.kind === 'plaintext' ? content.value : new MarkdownString(content.value);
  }

  const markdown = new MarkdownString();
  for (const part of Array.isArray(content) ? content : [content]) {
    if (typeof part === 'string') {
      markdown.appendMarkdown(part);
    } else {
      markdown.appendCodeblock(part.value, part.language);
    }
  }
  return markdown;
};

const toVscodeRange = (range: { start: { line: number; character: number }; end: { line: number; character: number } }) =>
  new Range(new Position(range.start.line, range.start.character), new Position(range.end.line, range.end.character));

const toCssRange = (range: Range) => ({
  start: { line: range.start.line, character: range.start.character },
  end: { line: range.end.line, character: range.end.character }
});
