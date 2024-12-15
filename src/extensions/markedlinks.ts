import { MarkedExtension, Tokens } from 'marked';
import { encode } from 'html-entities';
import path from 'node:path';
import { replaceLast } from '../utils';

/**
 * Extension for adding target="_blank" to absolute URLs and switching
 * *.md links to *.html
 * @returns the marked extension
 */
export default function markedLinks():MarkedExtension
{
  return {
    async: false,
    renderer: {
      link: (token) => link(token)
    }
  };
}

function link(token:Tokens.Link):string|false
{
  // md -> html
  if(/\.md/i.test(token.href) && !path.isAbsolute(token.href))
  {
    const href = replaceLast(token.href, /\.md/ig, '.html');
    return `<a class="markugen-md-link" href="${href}"` +
           `${token.title ? ` title="${token.title}"` : ''}>` +
           `${encode(token.text)}</a>`;
  }
  // only add for outside links
  if (URL.canParse(token.href) && !token.href.startsWith('mailto:'))
  {
    return `<a target="_blank" href="${token.href}"` +
           `${token.title ? ` title="${token.title}"` : ''}>` +
           `${encode(token.text)}</a>`;
  }
  return false;
}