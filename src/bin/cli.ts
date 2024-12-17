#!/usr/bin/env node

import Markugen, { Options } from '../markugen';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { version, name } from '../../package.json';
import { findChrome } from '../utils';
import colors from 'colors';

// Handle startup
async function main() 
{
  const args = yargs(hideBin(process.argv))
    .parserConfiguration({
      'duplicate-arguments-array': false,
    })
    .help('h')
    .alias(['h', '?'], 'help')
    .options({
      format: {
        describe: 'format of input and output',
        choices: ['file', 'string'],
        default: 'file',
      },
      input: {
        alias: ['i'],
        describe:
          'the directory to locate the markdown files, a single file, or a string of markdown',
        type: 'string',
        demandOption: true,
      },
      output: {
        alias: ['o'],
        describe: 'directory to write the output',
        default: './output',
      },
      pdf: {
        alias: ['p'],
        describe: 'generates PDF files as additional output',
        type: 'boolean',
        default: false,
      },
      'pdf-only': {
        alias: ['po'],
        describe: 'implies --pdf and only generates the PDF files',
        type: 'boolean',
        default: false,
      },
      chrome: {
        alias: ['g'],
        describe: 'the path to the Chrome executable. This is only required ' +
          'if --pdf is true and Markugen is unable to locate the executable.',
        type: 'string',
        default: findChrome(),
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
      timestamp: {
        alias: ['ts'],
        describe: 'if true, a timestamp will be embedded in the js output',
        type: 'boolean',
        default: true
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
      'clear-assets': {
        alias: ['ca'],
        describe: 'if true and --pdf-only, will clear the assets after generation',
        type: 'boolean',
        default: false,
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
      color: {
        alias: ['c'],
        describe: 'if true, console output will be colored',
        type: 'boolean',
        default: true
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
    .parse() as Options;
  try 
  {
    await new Markugen(args).generate();
  }
  catch (e:any) 
  { 
    console.error(
      colors.red(args.debug ? `${e.message}\n${e.stack}` : e.message)
    ); 
  }
}

// startup the main application
main();
