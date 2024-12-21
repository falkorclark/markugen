import { MarkedExtension, Token } from 'marked';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import Markugen from '../markugen';

export interface Options 
{
  markugen:Markugen,
  file?:string,
}

/**
 * Extension for allowing execution of markugen commands
 * within code blocks.
 * @returns the marked extension
 */
export default function markedCommands(options:Options):MarkedExtension
{
  return {
    walkTokens: (token) => commands(token, options),
  };
}

function commands(token:Token, options:Options)
{
  if (token.type !== 'code') return;

  const match = token.text.match(Markugen.cmdRegex);
  if (match && match.groups && match.groups.cmd && match.groups.args)
  {
    // allow commands to be escaped
    if (match.groups.esc)
    {
      token.text = `markugen.${match.groups.cmd} ${match.groups.args}`;
    }
    else if (match.groups.cmd === 'exec')
    {
      options.markugen.log('Executing:', match.groups.args);
      const result = spawnSync(match.groups.args, [], {
        shell: true,
        encoding: 'utf8', 
        windowsVerbatimArguments: process.platform === 'win32' ? true : undefined,
      });
      const text = (result.stdout + '\n' + result.stderr).trim();
      // remove coloring characters
      token.text = text.replace(/(\x1b[^m]+m)/gi, '');
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