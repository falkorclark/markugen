
import { CommandModule, Argv, ArgumentsCamelCase } from 'yargs';
import Markugen, { MarkugenOptions, PdfOptions } from '../markugen';
import { MarkugenArgs } from './markugenargs';

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
      links: {
        alias: ['l'],
        describe: 'if true, markdown links generated by Markugen will be converted ' +
          'to PDF links',
        type: 'boolean',
        default: true
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
      await mark.htmltopdf({...args, cli: true});
    }
    catch (e:any)
    { 
      mark?.error(e);
      process.exit(1); 
    }
  };
}