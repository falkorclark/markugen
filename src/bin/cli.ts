#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { name } from '../../package.json';
import { MdToHtml } from '../commands/mdtohtml';
import { HtmlToPdf } from '../commands/htmltopdf';

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
    .command(new MdToHtml)
    .command(new HtmlToPdf)
    .scriptName(name)
    .parse();
}

// startup the main application
main();
