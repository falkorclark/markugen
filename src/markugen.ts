
import colors from 'colors';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Generator from './generator';
import { version, name, homepage } from '../package.json';
import { Options, Themes } from './options';
import { timeFormat } from './utils';
import { defaultThemes } from './themes';
import Preprocessor from './preprocessor';
import IMarkugen from './imarkugen';
import { spawnSync } from 'node:child_process';

export * from './options';
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
   * Contains the options that were given on construction
   */
  public readonly options:Required<Options>;
  /**
   * Root path to the Markugen package
   */
  public readonly root:string;
  /**
   * The preprocessor to use for template expansion
   */
  public readonly preprocessor:Preprocessor;
  /**
   * Set to true if this is being ran from the cli
   */
  public readonly cli:boolean;
  /**
   * The generate start time for recording elapsed time
   */
  private startTime:[number,number]|undefined;

  /**
   * Constructs a new instance with the given {@link options}.
   * The {@link cli} parameter is used internally for when executed from
   * the command line.
   */
  public constructor(options:Options, cli?:boolean)
  {
    this.root = path.dirname(__dirname);
    this.cli = cli ?? false;
    this.options = {
      format: 'file',
      extensions: ['md'],
      outputFormat: 'file',
      output: './output',
      outputName: '',
      pdf: false,
      chrome: '',
      exclude: [],
      title: 'Markugen v' + Markugen.version,
      inheritTitle: false,
      footer: '',
      timestamp: true,
      home: '',
      toc: 3,
      embed: false,
      favicon: '',
      assets: [],
      keepAssets: false,
      script: '',
      js: [],
      style: '',
      css: [],
      theme: defaultThemes,
      vars: {},
      includeHidden: false,
      clearOutput: false,
      color: true,
      quiet: false,
      debug: false,
      ...options,
    };
    // create the preprocessor
    this.preprocessor = new Preprocessor(this, this.options.vars);
    // validate the options
    this.validate();

    //console.dir(this.options, {depth:null})
    //process.exit()
  }
  /**
   * Returns true if the given file is relative to the input directory or is
   * a valid URL.
   * @param file the file to check
   * @returns true if the file is relative or a URL
   */
  public isRelative(file:string):boolean
  {
    // URLs are good to go 
    if (URL.canParse(file)) return true;
    // path cannot be absolute
    if (path.isAbsolute(file)) return false;
    // must be relative to the input directory
    return fs.existsSync(path.resolve(this.inputDir, file));
  }

  /**
   * This is a synchronous version of {@link generate}. Calling this version
   * will ignore the {@link Options.pdf} flag and only generate html output.
   * See {@link generate} for more details.
   * @returns the path to the home page, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public generateSync():string|undefined
  {
    this.startTime = process.hrtime();
    this.options.pdf = false;
    const out = new Generator(this).generate();
    this.outputElapsed();
    return out;
  }

  /**
   * Generates the documentation. This method can be async or synchronous and
   * the type is dependent on the {@link Options.pdf} flag. If the
   * {@link Options.pdf} flag is true, the method will be async, else it will 
   * be synchronous.
   * @returns the path to the home page, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public generate():Promise<string|undefined>|string|undefined
  {
    this.startTime = process.hrtime();
    if (this.options.pdf)
    {
      return new Promise(
        (resolve, reject) => 
        {
          new Generator(this).generatePdfs()
            .then(
              (result) => 
              {
                this.outputElapsed();
                resolve(result);
              }
            )
            .catch(
              (err) => 
              {
                this.outputElapsed();
                reject(err);
              }
            );
        }
      );
    }
    const out = new Generator(this).generate();
    this.outputElapsed();
    return out;
  }

  /**
   * Validates the options and makes changes where necessary
   */
  private validate()
  {
    // enable/disable console colors
    if (this.options.color) colors.enable();
    else colors.disable();

    // must have at least one extension
    if (this.options.extensions.length < 1) this.options.extensions.push('md');

    // pdf implies output format of file
    if (this.options.pdf && this.options.outputFormat === 'string')
    {
      this.warning(`Output format changing to ${colors.green('file')} for PDF generation`);
      this.options.outputFormat = 'file';
    }
    // quiet mode if string output
    if (this.options.outputFormat === 'string') this.options.quiet = true;

    // unescape newlines provided in the string
    if (this.options.format === 'string' && this.cli) 
      this.options.input = this.options.input.replace(/\\n/g, '\n');

    // validate the input and options based on input
    if (!this.isInputString)
    {
      this.options.input = path.resolve(this.options.input);
      if (!fs.existsSync(this.options.input))
        throw new Error(`Input does not exist [${colors.red(this.options.input)}]`);
    }
    // set the name of the output file
    if (this.isInputSolo && !this.options.outputName)
    {
      const name = this.isInputString ? 'index' : path.parse(this.options.input).name;
      this.options.outputName = name;
    }

    // handle pdf options
    if (this.options.pdf && (!this.options.chrome || !fs.existsSync(this.options.chrome)))
      throw new Error('Unable to locate Chrome executable, cannot generate PDFs');

    // output string only valid for input string
    if (this.options.outputFormat === 'string' && !this.isInputFile && this.options.format !== 'string')
      throw new Error('Output format can only be string if input is a string or a file');

    // string format implies embed
    if (this.options.format === 'string' || this.options.outputFormat === 'string')
      this.options.embed = true;
    
    // solo input implies inherit title
    if (this.isInputSolo) this.options.inheritTitle = true;
      
    // resolve output
    this.options.output = path.resolve(this.options.output);

    // check on protected directories
    if(this.options.clearOutput)
    {
      const nono = [
        path.resolve('/'),
        this.inputDir,
        process.cwd(),
      ];
      if (nono.includes(this.output))
      {
        this.warning(`Output set to protected directory [${colors.red(this.output)}], skipping clear output`);
        this.options.clearOutput = false;
      }
    }

    this.setTheme();
    this.checkFavicon();
    this.checkCss();
    this.checkJs();
    this.checkExcluded();
  }

  /**
   * Outputs the elapsed time
   */
  private outputElapsed()
  {
    const end = process.hrtime(this.startTime);
    const ms = end[0] * 1000 + end[1] / 1000000;
    this.log('Elapsed Time:', timeFormat(ms, {fixed: 2}));
  }

  /**
   * @returns true if the input given is a single file
   */
  public get isInputFile() { return fs.existsSync(this.input) && fs.lstatSync(this.input).isFile(); }
  /**
   * @returns true if the input given is a string
   */
  public get isInputString() { return this.options.format === 'string'; }
  /**
   * @returns true if the input is a string or file
   */
  public get isInputSolo() { return this.isInputString || this.isInputFile; }
  /**
   * @returns the path to the input
   */
  public get input() { return this.options.input; }
  /**
   * @returns the path to the input directory
   */
  public get inputDir()
  {
    return this.isInputFile ? path.dirname(this.input) : this.input;
  }
  /**
   * @returns the path to the output directory
   */
  public get output() { return this.options.output; }
  /**
   * @returns true if hidden files and folders should be included
   */
  public get includeHidden() { return this.options.includeHidden; }
  
  /**
   * @returns true if the output should be cleared first
   */
  public get clearOutput() { return this.options.clearOutput; }

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
      platform: os.platform() === 'win32' ? 'windows' : 'linux',
      homepage: Markugen.homepage,
    };
  }

  /**
   * Checks to see if the path is excluded.
   * @param file the path to check for exclusion
   * @returns true if the path is excluded, false otherwise
   */
  public isExcluded(file:string):boolean
  {
    for(const exclude of this.options.exclude)
      if (file === exclude) return true;
    // check the hidden files and folders
    return !this.options.includeHidden && path.basename(file).startsWith('.');
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
      default: return Markugen.findChromeLinux();
    }
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

  /**
   * Checks that the files are relative to the input directory and filters
   * out the ones that are not. Also resolves each path.
   * @param files the files to check for relativeness
   * @returns the new files with non-relative files removed
   */
  private filterRelative(files:string[])
  {
    const filtered = files.filter((file) => 
    {
      if (file === '') return false;
      if (!this.isRelative(file))
      {
        this.warning(`Given file is not relative to input directory [${colors.red(file)}]`);
        return false;
      }
      return true;
    });
    // resolve to full paths
    for (let i = 0; i < filtered.length; i++) 
      filtered[i] = path.resolve(this.inputDir, filtered[i]);
    return filtered;
  }

  /**
   * Checks the validity of the excluded files
   */
  private checkExcluded()
  {
    // assets should be excluded
    for (const ass of this.options.assets) this.options.exclude.push(ass);
    this.options.exclude = this.filterRelative(this.options.exclude);
  }
  /**
   * Checks the validity of the js files
   */
  private checkJs()
  {
    this.options.js = this.filterRelative(this.options.js);
  }
  /**
   * Checks the validity of the css files
   */
  private checkCss()
  {
    this.options.css = this.filterRelative(this.options.css);
  }
  /**
   * Sets the appropriate themes based on the given values
   * @param themes the provided themes
   */
  private setTheme(themes?:Themes)
  {
    if (!themes) this.options.theme = defaultThemes;
    else 
    {
      this.options.theme = {
        light: themes.light ? 
          {...defaultThemes.light, ...themes.light} : defaultThemes.light, 
        dark: themes.dark ? 
          {...defaultThemes.dark, ...themes.dark} : defaultThemes.dark, 
      };
    }
  }
  /**
   * Checks the validity of the favicon
   */
  private checkFavicon()
  {
    if (this.options.favicon && !this.isRelative(this.options.favicon))
    {
      this.warning(`Given favicon is not relative to the input directory [${colors.red(this.options.favicon)}]`);
      this.options.favicon = '';
    }
  }
}