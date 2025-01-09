#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { name } from '../../package.json';
import { HtmlCommand } from '../commands/htmlcommand';

// Handle startup
async function main() 
{
  await yargs(hideBin(process.argv))
    .parserConfiguration({
      'duplicate-arguments-array': false,
      'strip-aliased': true,
      'strip-dashed': true,
    })
    .showHelpOnFail(false)
    .alias(['h'], 'help')
    .help('h')
    .command(new HtmlCommand)
    .scriptName(name)
    .parse();
}

// startup the main application
main();
