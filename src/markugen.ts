
import colors from 'colors';
import path from 'node:path';
import fs from 'fs-extra';
import os from 'node:os';
import { HtmlGenerator } from './htmlgenerator';
import { version, name, homepage } from '../package.json';
import { MarkugenOptions } from './markugenoptions';
import { IMarkugen } from './imarkugen';
import { spawnSync } from 'node:child_process';
import { HtmlOptions } from './htmloptions';
import PdfGenerator from './pdfgenerator';

export * from './imarkugen';
export * from './htmlgenerator';
export * from './markugenoptions';
export * from './htmloptions';
export * from './utils';

export interface OutputLabel 
{
  label: string,
  color?: colors.Color,
  ignoreQuiet?: boolean,
}

export default class Markugen
{
  /**
   * The version of Markugen
   */
  public static readonly version:string = version;
  /**
   * The name of Markugen
   */
  public static readonly name:string = name;
  /**
   * The home page of Markugen
   */
  public static readonly homepage:string = homepage;
  /**
   * Regular expression used for Markugen commands
   */
  public static readonly cmdRegex:RegExp = /^\s*(?<esc>[\\]?)markugen\. *(?<cmd>[a-z_0-9]+) +(?<args>.+)/i;
  /**
   * Used to generate ids the same each time
   */
  public static globalId:number = 1;

  /**
   * Root path to the Markugen package
   */
  public readonly root:string;
  /**
   * Set to true if this is being ran from the cli
   */
  public readonly options:Required<MarkugenOptions>;

  /**
   * Constructs a new instance with the given {@link options}.
   */
  public constructor(options?:MarkugenOptions)
  {
    this.root = path.dirname(__dirname);
    this.options = {
      color: options?.color ?? true,
      quiet: options?.quiet ?? false,
      debug: options?.debug ?? false,
      cli: options?.cli ?? false,
    };
    // enable/disable console colors
    if (this.options.color) colors.enable();
    else colors.disable();
  }

  /**
   * This is a synchronous version of {@link generate}. Calling this version
   * will ignore the {@link HtmlOptions.pdf} flag and only generate html output.
   * See {@link generate} for more details.
   * @returns the paths to all generated pages, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public generateSync(options:HtmlOptions):string|string[]|undefined
  {
    return this.generator(options).generate();
  }

  /**
   * Generates the documentation. This method can be async or synchronous and
   * the type is dependent on the {@link HtmlOptions.pdf} flag. If the
   * {@link Options.pdf} flag is true, the method will be async, else it will 
   * be synchronous.
   * @returns the path to the home page, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public async generate(options:HtmlOptions):Promise<string|string[]|undefined>
  {
    const gen = this.generator(options);
    const generated = gen.generate();
    if (gen.options.pdf && generated)
    {
      return await new PdfGenerator(this).generate({
        input: generated,
        remove: true,
      });
    }
    return generated;
  }

  /**
   * Creates and returns the generator along with updates to the args 
   * based on user input.
   */
  private generator(options:HtmlOptions)
  {
    // unescape newlines provided in the string
    if (options.format === 'string' && this.options.cli) 
      options.input = options.input.replace(/\\n/g, '\n');

    const gen = new HtmlGenerator(this, options);
    // quiet mode if string output
    if (gen.options.outputFormat === 'string' && !gen.options.pdf) 
      this.options.quiet = true;

    return gen;
  }

  /**
   * Outputs the given error message
   * @param e the error to log
   */
  public error(e:Error)
  {
    const msg = this.options.debug && e.stack ? 
      colors.red(e.stack) : 
      `${colors.red('Error:')} ${e.message}`;
    console.error(msg);
  }

  /**
   * Starts a console group
   */
  public group(...args:any[]) 
  { 
    if(!this.options.quiet) console.group(...args); 
  }
  /**
   * Ends a console group
   */
  public groupEnd() { if(!this.options.quiet) console.groupEnd(); }

  /**
   * Use in place of console.log so the app can handle coloring
   * and any cli options that were given
   */
  public log(label:OutputLabel|string, ...args:any[])
  {
    const ol = typeof label === 'string' ? {label: label} : label;
    if (!this.options.quiet && ol.ignoreQuiet !== true) 
    {
      const color = ol.color ? ol.color : colors.green;
      if (ol.label) console.log(color(ol.label), ...args);
      else console.log(...args);
    }
  }
  /**
   * Use in place of console.log so the app can handle coloring
   * and any cli options that were given
   */
  public warning(...args:any[])
  {
    this.log({ label: 'Warning:', color: colors.yellow }, ...args);
  }

  /**
   * Escapes all markdown special characters in the given value and returns
   * the new string.
   */
  public static escape(md:any):string
  {
    return md ? md.toString().replace(/([\\`*_{}[\]()#+\-.!:])/g, '\\$1') : '';
  }
  /**
   * Returns an object representing the Markugen properties
   */
  public static toObject(date?:Date):IMarkugen
  {
    return {
      version: Markugen.version,
      name: Markugen.name,
      timestamp: date,
      platform: process.platform === 'win32' ? 'windows' : 'linux',
      homepage: Markugen.homepage,
    };
  }
  
  /**
   * Attempts to locate an executable for Google Chrome
   * @returns the path to chrome if found, else returns undefined
   */
  public static findChrome():string|undefined
  {
    switch(process.platform)
    {
      case 'win32': return Markugen.findChromeWindows();
      case 'darwin': return Markugen.findChromeMac();
      case 'linux': return Markugen.findChromeLinux();
    }
    return undefined;
  }

  /**
   * Attempts to locate an executable for Google Chrome on Windows
   * @returns the path to chrome if found, else returns undefined
   */
  public static findChromeWindows():string|undefined
  {
    const suffix = '\\Google\\Chrome\\Application\\chrome.exe';
    const prefixes = [
      process.env.LOCALAPPDATA,
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)']
    ];
    for (const prefix of prefixes)
    {
      if (prefix)
      {
        const test = path.join(prefix, suffix);
        if (fs.existsSync(test)) return test;
      }
    }
    return undefined;
  }

  /**
   * Attempts to locate an executable for Google Chrome on Mac
   * @returns the path to chrome if found, else returns undefined
   */
  public static findChromeMac():string|undefined
  {
    const toExec = '/Contents/MacOS/Google Chrome';
    const regPath = '/Applications/Google Chrome.app' + toExec;
    const altPath = path.join(os.homedir(), regPath);
    const mdFindCmd = 'mdfind \'kMDItemDisplayName == "Google Chrome" && kMDItemKind == Application\'';

    if (fs.existsSync(regPath)) return regPath;
    if (fs.existsSync(altPath)) return altPath;

    // try the md command last
    const result = spawnSync(mdFindCmd);
    if (result.status === 0 && result.stdout) 
      return result.stdout.toString().trim() + toExec;

    return undefined;
  }

  /**
   * Attempts to locate an executable for Google Chrome on Linux
   * @returns the path to chrome if found, else returns undefined
   */
  public static findChromeLinux():string|undefined
  {
    const result = spawnSync('which google-chrome');
    if (result.status === 0 && result.stdout) 
      return result.stdout.toString().trim();
    return undefined;
  }
}