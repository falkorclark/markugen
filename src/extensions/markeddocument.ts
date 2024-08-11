import { MarkedExtension } from 'marked';
import { encode } from 'html-entities';

export type Properties = Record<string, string>;

export interface Options 
{
  title?:string,
  style?:string,
  script?:string,
  css?:string|string[],
  js?:string|string[],
  link?:Properties|Properties[],
}

/**
 * Extension for wrapping marked html in an html document
 * @param options the options to use for the document
 * @returns the marked extension
 */
export default function markedDocument(options?:Options):MarkedExtension
{
  return {
    async: false,
    hooks: {
      postprocess: (html) => document(html, options),
    }
  };
}

function document(html:string, options?:Options):string
{
  // begin the document
  let out = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">`;

  // add the title
  if (options && options.title) 
    out += `\n    <title>${encode(options.title)}</title>`;
  // add the inline styles
  if (options && options.style) 
    out += `\n    <style>\n    ${options.style}\n    </style>`;
  // add the linked styles
  if (options && options.css)
  {
    const links = Array.isArray(options.css) ? options.css : [options.css];
    for (const link of links)
      out += `\n    <link rel="stylesheet" href="${link}">`;
  }
  // add the links
  if (options && options.link)
  {
    const links = Array.isArray(options.link) ? options.link : [options.link];
    for (const link of links)
    {
      let l = '\n    <link';
      for (const [key, value] of Object.entries(link))
        l += ` ${key}="${value}"`;
      out += `${l}>`;
    }
  }

  // close head, start body
  out += `\n  </head>\n  <body>\n    ${html}`;

  // add the linked javascript
  if (options && options.js)
  {
    const links = Array.isArray(options.js) ? options.js : [options.js];
    for (const link of links)
      out += `\n    <script src="${link}"></script>`;
  }
  // add the inline script
  if (options && options.script) 
    out += `\n    <script>\n    ${options.script}\n    </script>`;

  // close out and return
  return `${out}\n  </body>\n</html>`;
}