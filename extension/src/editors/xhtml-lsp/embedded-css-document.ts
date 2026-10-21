import { TextDocument } from 'vscode-languageserver-textdocument';

export type EmbeddedCssRegion = { start: number; end: number; tagStart?: number };
export type EmbeddedCssDocument = { document: TextDocument; regions: EmbeddedCssRegion[] };

export const createEmbeddedCssDocument = (source: string, uri: string, version: number, offset: number) => {
  const embeddedCss = createEmbeddedCssDocumentForDocument(source, uri, version);
  const containingRegion = embeddedCss?.regions.find(region => offset >= region.start && offset <= region.end);
  if (!containingRegion || isInsideIvyExpression(source, containingRegion, offset)) {
    return;
  }
  return embeddedCss?.document;
};

export const createEmbeddedCssDocumentForDocument = (source: string, uri: string, version: number): EmbeddedCssDocument | undefined => {
  const regions = findCssRegions(source);
  if (regions.length === 0) {
    return;
  }

  const cssCharacters = source.split('');
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== '\n' && source[index] !== '\r') {
      cssCharacters[index] = ' ';
    }
  }

  for (const region of regions) {
    const cssText = maskNonCssSyntax(source.slice(region.start, region.end));
    for (let index = 0; index < cssText.length; index++) {
      cssCharacters[region.start + index] = cssText.charAt(index);
    }

    if (region.tagStart !== undefined) {
      cssCharacters[region.tagStart] = 'a';
      cssCharacters[region.tagStart + 1] = '{';
      cssCharacters[region.end] = '}';
    }
  }

  return {
    document: TextDocument.create(`${uri}#embedded-css`, 'css', version, cssCharacters.join('')),
    regions
  };
};

const findCssRegions = (source: string): EmbeddedCssRegion[] => {
  const regions: EmbeddedCssRegion[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const tagStart = source.indexOf('<', cursor);
    if (tagStart < 0) {
      break;
    }

    if (source.startsWith('<!--', tagStart)) {
      cursor = findClosingMarkup(source, '-->', tagStart + 4);
      continue;
    }
    if (source.startsWith('<![CDATA[', tagStart)) {
      cursor = findClosingMarkup(source, ']]>', tagStart + 9);
      continue;
    }
    if (source.startsWith('<!', tagStart) || source.startsWith('<?', tagStart)) {
      cursor = findTagEnd(source, tagStart);
      continue;
    }

    const tagEnd = findTagEnd(source, tagStart);
    const openingTag = source.slice(tagStart, tagEnd);
    if (/^<\s*\//.test(openingTag)) {
      cursor = tagEnd;
      continue;
    }

    const tagName = openingTag.match(/^<\s*([\w:.-]+)/)?.[1]?.toLowerCase();
    if (tagName === 'style' || tagName === 'script') {
      const closingTag = findClosingElement(source, tagName, tagEnd);
      if (tagName === 'style') {
        regions.push({ start: tagEnd, end: closingTag?.start ?? source.length });
      }
      cursor = closingTag?.end ?? source.length;
      continue;
    }

    const styleAttribute = /(?:^|\s)style\s*=\s*(["'])([\s\S]*?)\1/gi;
    let attribute: RegExpExecArray | null;
    while ((attribute = styleAttribute.exec(openingTag))) {
      const quote = attribute[1];
      const value = attribute[2];
      if (quote === undefined || value === undefined) {
        continue;
      }
      const quoteOffset = attribute[0].indexOf(quote);
      const start = tagStart + attribute.index + quoteOffset + 1;
      regions.push({ start, end: start + value.length, tagStart });
    }
    cursor = tagEnd;
  }

  return regions.filter(region => region.end >= region.start);
};

const findTagEnd = (source: string, tagStart: number) => {
  let quote: string | undefined;
  for (let index = tagStart + 1; index < source.length; index++) {
    const character = source.charAt(index);
    if (quote) {
      if (character === quote) {
        quote = undefined;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }
  return source.length;
};

const findClosingMarkup = (source: string, closingText: string, fromIndex: number) => {
  const closingIndex = source.indexOf(closingText, fromIndex);
  return closingIndex < 0 ? source.length : closingIndex + closingText.length;
};

const findClosingElement = (source: string, tagName: 'style' | 'script', fromIndex: number) => {
  const closingTag = new RegExp(`<\\/${tagName}\\s*>`, 'i');
  const match = closingTag.exec(source.slice(fromIndex));
  if (!match || match.index === undefined) {
    return;
  }
  return { start: fromIndex + match.index, end: fromIndex + match.index + match[0].length };
};

const maskNonCssSyntax = (cssText: string) =>
  cssText
    .replace(/<!\[CDATA\[|\]\]>/g, maskPreservingLines)
    .replace(/#\{[^}]*\}/g, maskPreservingLines);

const maskPreservingLines = (text: string) => text.replace(/[^\r\n]/g, ' ');

const isInsideIvyExpression = (source: string, region: EmbeddedCssRegion, offset: number) => {
  const regionText = source.slice(region.start, region.end);
  const expression = /#\{[^}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(regionText))) {
    const start = region.start + match.index;
    const end = start + match[0].length;
    if (offset >= start && offset < end) {
      return true;
    }
  }
  return false;
};
