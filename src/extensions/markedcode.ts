import { MarkedExtension, Token } from 'marked';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import Markugen from '../markugen';

export interface Options {
  markugen:Markugen,
  file?:string,
}

/**
 * Extension for allowing execution of markugen commands
 * within code blocks.
 * @returns the marked extension
 */
export default function markedCode(options:Options):MarkedExtension
{
  return {
    walkTokens: (token) => code(token, options),
  };
}

function code(token:Token, options:Options)
{
  if (token.type !== 'code') return;

  const regex = /^markugen\. *(?<cmd>[a-z_0-9]+) +(?<args>.+)/i;
  const match = token.text.match(regex);
  //console.dir(match)
  if (match && match.groups && match.groups.cmd && match.groups.args)
  {
    if (match.groups.cmd === 'exec')
    {
      options.markugen.log('Executing:', match.groups.args);
      const args = match.groups.args.split(' ');
      const result = spawnSync(
        args[0], args.length > 1 ? args.slice(1) : [],
        { shell: true, encoding: 'utf8' }
      );
      if (!result.error)
      {
        const text = (result.stdout + '\n' + result.stderr).trim();
        // remove coloring characters
        token.text = text.replace(/(\x1b[^m]+m)/gi, '');
      }
      else token.text = JSON.stringify(result.error);
    }
    else if (match.groups.cmd === 'import')
    {
      const reldir = options.file ? path.dirname(options.file) : process.cwd();
      const importfile = path.resolve(reldir, match.groups.args);
      if (fs.existsSync(importfile))
      {
        options.markugen.log('Importing:', importfile);
        token.text = fs.readFileSync(importfile, {encoding: 'utf8'});
      }
      else options.markugen.warning(`Unable to locate import file [${importfile}]`);
    }
  }
}