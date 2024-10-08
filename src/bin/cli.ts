#!/usr/bin/env node

import Markugen, { Options } from '../markugen';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { version, name } from '../../package.json';

// Handle startup
function main() 
{
  try 
  {
    const args = yargs(hideBin(process.argv))
      .help('h')
      .alias(['h', '?'], 'help')
      .options({
        format: {
          describe: 'format of input and output',
          options: ['file', 'string'],
          default: 'file',
        },
        input: {
          alias: ['i'],
          describe:
            'the directory to locate the markdown files or a single file',
          type: 'string',
          demandOption: true,
        },
        output: {
          alias: ['o'],
          describe: 'directory to write the output',
          default: './output',
        },
        exclude: {
          alias: ['x'],
          describe: 'list of files or folders to exclude from generation',
          type: 'array',
        },
        title: {
          alias: ['t'],
          describe: 'the title to use for the site',
          default: 'Markugen v' + version,
          type: 'string',
        },
        'inherit-title': {
          alias: ['it'],
          describe:
            'if true, all pages not custom configured will inherit the site title',
          type: 'boolean',
        },
        footer: {
          alias: ['f'],
          describe: 'overrides the default Markugen footer',
          type: 'string',
        },
        home: {
          alias: ['index'],
          describe:
            'sets the home page for the site, default uses the first root page',
          type: 'string',
        },
        toc: {
          describe:
            'maximum header depth to output in the Table of Contents, values less than ' +
            'or equal to zero will hide the Table of Contents.',
          type: 'number',
          default: 3,
        },
        embed: {
          alias: ['e'],
          describe: 'if true, css and javascript will be embedded in each page',
          type: 'boolean',
        },
        favicon: {
          describe:
            'relative path to an icon to use as the favicon, must be relative to the input directory',
          type: 'string',
        },
        assets: {
          alias: ['a'],
          describe: 'list of files or folders to copy to the output',
          type: 'array',
        },
        script: {
          describe:
            'additional JavaScript to embed in the script tag at the end of the body',
          type: 'string',
        },
        js: {
          describe: 'additional JavaScript files to include on each page',
          type: 'array',
        },
        style: {
          describe: 'additional CSS to embed in the style tag',
          type: 'string',
        },
        css: {
          describe: 'additional CSS files to include on each page',
          type: 'array',
        },
        'include-hidden': {
          alias: ['ih'],
          describe: 'include folders and files that begin with a dot (.)',
          type: 'boolean',
          default: false,
        },
        'clear-output': {
          alias: ['co'],
          describe: 'clears the output folder before building',
          type: 'boolean',
          default: false,
        },
        quiet: {
          alias: ['q'],
          describe: 'if given, no output will be displayed',
          type: 'boolean',
        },
        debug: {
          describe: 'turns on debugging',
          type: 'boolean',
        },
      })
      .config('config', 'provide a JSON configuration file for options')
      .scriptName(name)
      .parse();
    new Markugen(args as Options).generate();
  }
  catch (e) { console.error(e); }
}

// startup the main application
main();
