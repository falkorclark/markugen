import { MarkedExtension, Token } from 'marked';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import HtmlGenerator from '../htmlgenerator';

export interface Options 
{
  generator:HtmlGenerator,
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

  const match = token.text.match(HtmlGenerator.cmdRegex);
  if (match && match.groups && match.groups.cmd && match.groups.args)
  {
    // allow commands to be escaped
    if (match.groups.esc)
    {
      token.text = `markugen.${match.groups.cmd} ${match.groups.args}`;
    }
    else if (match.groups.cmd === 'exec')
    {
      options.generator.log('Executing:', match.groups.args);
      const result = spawnSync(match.groups.args, [], {
        shell: true,
        encoding: 'utf8', 
        windowsVerbatimArguments: process.platform === 'win32' ? true : undefined,
      });
      const text = (result.stdout + '\n' + result.stderr).trim();
      // remove coloring characters
      token.text = text.replace(/(\x1b[^m]+m)/gi, '');
      if (result.stderr)
      {
        options.generator.group();
        options.generator.warning(text);
        options.generator.groupEnd();
      }
    }
    else if (match.groups.cmd === 'import')
    {
      const reldir = options.file ? path.dirname(options.file) : process.cwd();
      const importfile = path.resolve(reldir, match.groups.args);
      options.generator.log('Importing:', importfile);
      if (fs.existsSync(importfile))
      {
        token.text = fs.readFileSync(importfile, {encoding: 'utf8'});
      }
      else
      {
        options.generator.group();
        options.generator.warning(`Unable to locate import file [${importfile}]`);
        options.generator.groupEnd();
      }
    }
  }
}