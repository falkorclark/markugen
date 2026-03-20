#!/usr/bin/env node

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { MdToHtml } from '../commands/mdtohtml';
import { HtmlToPdf } from '../commands/htmltopdf';
import Markugen from '../markugen';

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
    .help('help', 'show help and exit')
    .version('version', 'show version and exit', Markugen.version)
    .alias({ help: ['h', '?'] })
    .command(new MdToHtml)
    .command(new HtmlToPdf)
    .scriptName(Markugen.name)
    .parse();
}

// startup the main application
main();
