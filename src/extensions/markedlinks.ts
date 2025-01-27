import { MarkedExtension } from 'marked';
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
      link(token)
      {
        // md -> html
        if(/\.md/i.test(token.href) && !path.isAbsolute(token.href))
        {
          const href = replaceLast(token.href, /\.md/ig, '.html');
          let text = this.parser.parseInline(token.tokens);

          // check matching text in link text
          const html = path.basename(href.split('#')[0]);
          const md = path.basename(token.href.split('#')[0]);
          text = text.replace(md, html);
          
          return `<a class="markugen-md-link" href="${href}"` +
                 `${token.title ? ` title="${token.title}"` : ''}>` +
                 `${text}</a>`;
        }
        // only add for outside links
        if (URL.canParse(token.href) && !token.href.startsWith('mailto:'))
        {
          return `<a target="_blank" href="${token.href}"` +
                 `${token.title ? ` title="${token.title}"` : ''}>` +
                 `${this.parser.parseInline(token.tokens)}</a>`;
        }
        return false;
      }
    }
  };
}
