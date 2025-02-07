
import { CommandModule, Argv, ArgumentsCamelCase } from 'yargs';
import { version } from '../../package.json';
import Markugen, { MarkugenOptions, HtmlOptions } from '../markugen';
import { MarkugenArgs } from './markugenargs';
import fs from 'fs-extra';
import path from 'node:path';

type Options = MarkugenOptions & HtmlOptions;

export class MdToHtml<U extends Options> implements CommandModule<object, U> 
{
  public command = ['$0', 'html', 'mdtohtml'];
  public describe = 'Markdown to HTML and/or PDF file generation';

  public builder(args:Argv): Argv<U> 
  {
    args.options({
      format: {
        alias: ['input-format', 'if'],
        describe: 'format of the input, string of markdown or path to file/directory',
        choices: ['file', 'string'],
        default: 'file',
      },
      'output-format': {
        alias: ['of'],
        describe: 'format of the output, html files or string of html ' +
          '(string is only valid if format is also string or input is a file)',
        choices: ['file', 'string'],
        default: 'file',
      },
      input: {
        alias: ['i'],
        describe: 'the directory to locate the markdown files, a single file, ' +
          'or a string of markdown',
        type: 'string',
        demandOption: true,
      },
      extensions: {
        alias: ['exts'],
        describe: 'list of file extensions to search the input directory for',
        type: 'array',
        default: ['md'],
      },
      output: {
        alias: ['o'],
        describe: 'directory to write the output',
        default: './output',
      },
      outputName: {
        alias: ['n', 'on'],
        describe: 'base name of the file to output, only used when --input is ' +
          'a file or string, defaults to index for strings and the file name for files',
      },
      pdf: {
        alias: ['p'],
        describe: 'generates PDF files instead of html files',
        type: 'boolean',
        default: false,
      },
      'pdf-only': {
        alias: ['po'],
        describe: 'implies --pdf and removes all html generated files, leaving only the PDFs',
        type: 'boolean',
        default: false,
      },
      exclude: {
        alias: ['x'],
        describe: 'list of files or folders to exclude from generation, paths ' +
          'should be relative to the input directory',
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
        describe: 'if true, all pages not custom configured will inherit the site title',
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
        describe: 'sets the home page for the site, default uses the first root page',
        type: 'string',
      },
      toc: {
        describe: 'maximum header depth to output in the Table of Contents, values less than ' +
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
        describe: 'relative path to an icon to use as the favicon, must be ' +
          'relative to the input directory',
        type: 'string',
      },
      assets: {
        alias: ['a'],
        describe: 'list of files or folders to copy to the output',
        type: 'array',
      },
      'keep-assets': {
        alias: ['k', 'ka'],
        describe: 'if true and --pdf, will keep the assets after generation',
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
      vars: {
        alias: ['v'],
        describe: 'path to a JSON file representing dynamic variables used in ' +
          'template expansion',
        type: 'string',
        coerce: fs.readJSONSync,
      },
      ...MarkugenArgs,
    });
    return args as unknown as Argv<U>;
  };

  public async handler(args:ArgumentsCamelCase<U>)
  {
    // create the markugen instance
    let mark = undefined;
    try 
    {
      mark = new Markugen({ cli: true });
      await mark.generate({ ...args, cli: true });
    }
    catch (e:any)
    { 
      mark?.error(e);
      process.exit(1); 
    }
  };
}