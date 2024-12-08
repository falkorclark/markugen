import { MarkedExtension, Tokens } from 'marked';
import { randomUUID } from 'node:crypto';
import Markugen from '../markugen';
import path from 'node:path';

/**
 * Extension for adding a copy and save button to code blocks
 * @returns the marked extension
 */
export default function markedCopySaveCode():MarkedExtension
{
  return {
    async: false,
    renderer: {
      code: (token) => code(token)
    }
  };
}

function code(token:Tokens.Code):string|false
{
  // default language
  if (!token.lang) token.lang = 'txt';

  let file = undefined;
  const match = token.raw.match(Markugen.cmdRegex);
  if (match && match.groups && match.groups.cmd && match.groups.args && match.groups.cmd === 'import')
    file = path.basename(match.groups.args);
 
  // create an id
  const id = `copy-save-${Markugen.globalId++}`;
  return `<div class="markugen-code">
  <div class="markugen-code-toolbar">
    <div class="markugen-code-title">${file ? file : '.' + token.lang}</div>
  ${copy(id)}
  ${file ? save(id, file) : ''}
  </div>
  <pre class="markugen-code-content"><code id="${id}" class="hljs language-${token.lang}">${token.text}</code></pre>
</div>`;
}

function copy(id:string)
{
  return `  <div title="Copy to Clipboard" class="markugen-code-copy" onclick="markugen.copyToClipboard('${id}', this)">
      <svg height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--markugen-color)">
        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h167q11-35 43-57.5t70-22.5q40 0 71.5 22.5T594-840h166q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560h-80v120H280v-120h-80v560Zm280-560q17 0 28.5-11.5T520-800q0-17-11.5-28.5T480-840q-17 0-28.5 11.5T440-800q0 17 11.5 28.5T480-760Z"/>
      </svg>
    </div>`;
}

function save(id:string, file:string)
{
  return `  <div title="Save to ${file}" class="markugen-code-save" onclick="markugen.saveToFile('${id}', '${file}', this)">
      <svg height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--markugen-color)">
        <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/>
      </svg>
    </div>`;
}