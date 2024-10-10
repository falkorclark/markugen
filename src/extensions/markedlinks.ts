import { MarkedExtension, Tokens } from 'marked';
import { encode } from 'html-entities';

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
  if(/\.md/i.test(token.href))
  {
    token.href = token.href.replace(/\.md/i, '.html');
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