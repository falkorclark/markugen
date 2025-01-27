
import { CommandModule, Argv, ArgumentsCamelCase } from 'yargs';
import Markugen, { MarkugenOptions, PdfOptions } from '../markugen';

type Options = MarkugenOptions & PdfOptions;

export class HtmlToPdf<U extends Options> implements CommandModule<object, U> 
{
  public command = ['pdf', 'htmltopdf'];
  public describe = 'HTML to PDF file generation';

  public builder(args:Argv): Argv<U> 
  {
    args.options({
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
        default: ['html'],
      },
      browser: {
        alias: ['b'],
        describe: 'the path to the Chrome or Firefox executable. This is only required ' +
          'if --pdf is true and Markugen is unable to locate the executable.',
        type: 'string',
        default: Markugen.findChrome(),
      },
      links: {
        alias: ['l'],
        describe: 'if true, markdown links generated by Markugen will be converted ' +
          'to PDF links',
        type: 'boolean',
        default: true
      },
      'no-sandbox': {
        describe: 'turns off the use of a sandbox for Chrome, this should only ' +
          'be necessary if running in a container',
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
        default: false,
      },
      debug: {
        describe: 'turns on debugging',
        type: 'boolean',
        default: false,
      },
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
      await mark.htmltopdf({...args, cli: true});
    }
    catch (e:any)
    { 
      mark?.error(e);
      process.exit(1); 
    }
  };
}