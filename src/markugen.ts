
import colors from 'colors';
import path from 'node:path';
import fs from 'fs-extra';
import os from 'node:os';
import { version, name, homepage } from '../package.json';
import { MarkugenOptions } from './markugenoptions';
import { MarkugenDetails } from './markugendetails';
import { spawnSync } from 'node:child_process';
import PdfGenerator, { PdfOptions } from './pdfgenerator';
import HtmlGenerator, { HtmlOptions } from './htmlgenerator';

export * from './markugendetails';
export * from './htmlgenerator';
export * from './pdfgenerator';
export * from './markugenoptions';
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
   * Root path to the Markugen package
   */
  public readonly root:string;
  /**
   * Set to true if this is being ran from the cli
   */
  private _options:Required<MarkugenOptions> = {
    browser: Markugen.findChrome() ?? '',
    sandbox: true,
    color: true,
    quiet: false,
    debug: false,
    cli: false,
  };

  /**
   * Constructs a new instance with the given {@link options}.
   */
  public constructor(options?:MarkugenOptions)
  {
    this.root = path.dirname(__dirname);
    if (options) this.options = options;
  }

  /**
   * @returns the current configuration options
   */
  public get options() { return this._options; }
  /**
   * Sets the configuration options
   */
  public set options(options:MarkugenOptions)
  {
    this._options.browser = options.browser ?? this._options.browser;
    this._options.sandbox = options.sandbox ?? this._options.sandbox;
    this._options.color = options.color ?? this._options.color;
    this._options.quiet = options.quiet ?? this._options.quiet;
    this._options.debug = options.debug ?? this._options.debug;
    this._options.cli = options.cli ?? this._options.cli;
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
  public mdtohtml(options:HtmlOptions & MarkugenOptions):string|string[]|undefined
  {
    return new HtmlGenerator(this, options).generate();
  }
  /**
   * Generates PDF documents for the given {@link PdfOptions options}.
   * @param options the {@link PdfOptions} for generation
   * @returns a list of files that were generated
   */
  public async htmltopdf(options:PdfOptions & MarkugenOptions):Promise<string[]>
  {
    return await new PdfGenerator(this, options).generate();
  }

  /**
   * Generates the HTML documentation and PDF files if {@link HtmlOptions.pdf}
   * is true.
   * @returns the paths to all generated pages, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public async generate(options:HtmlOptions & MarkugenOptions):Promise<string|string[]|undefined>
  {
    const gen = new HtmlGenerator(this, options);
    const generated = gen.generate();
    if (gen.options.pdf && generated)
    {
      const result = await new PdfGenerator(this, {
        input: generated,
        remove: gen.options.pdfOnly,
      }).generate();
      if (gen.options.pdfOnly) gen.removeGenerated();
      return result;
    }
    return generated;
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
   * Outputs the given error message
   * @param e the error to log
   */
  public error(e:Error)
  {
    const msg = this.options.debug && e.stack ? 
      colors.red(e.stack) : `${colors.red('Error:')} ${e.message}`;
    console.error(msg);
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
  public static toObject(date?:Date):MarkugenDetails
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