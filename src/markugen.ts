
import colors from 'colors';
import path from 'node:path';
import fs from 'node:fs';
import Generator from './generator';
import { version, name } from '../package.json';
import { Options, Themes } from './options';
import { timeFormat } from './utils';
import { defaultThemes } from './themes';

export * from './options';

export interface OutputLabel 
{
  label: string,
  color?: colors.Color,
  ignoreQuiet?: boolean,
  error?: {
    exit: boolean,
    code?: number,
  },
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
   * Regular expression used for Markugen commands
   */
  public static readonly cmdRegex:RegExp = /markugen\. *(?<cmd>[a-z_0-9]+) +(?<args>.+)/i;

  /**
   * Contains the options that were given on construction
   */
  public readonly options:Required<Options>;
  /**
   * Root path to the Markugen package
   */
  public readonly root:string;
  /**
   * The generate start time for recording elapsed time
   */
  private startTime:[number,number]|undefined;

  /**
   * Constructs a new instance with the given options
   */
  public constructor(options:Options)
  {
    this.root = path.dirname(__dirname);
    
    this.options = {
      format: 'file',
      output: './output',
      exclude: [],
      title: 'Markugen v' + Markugen.version,
      inheritTitle: false,
      footer: '',
      home: '',
      toc: 3,
      embed: false,
      favicon: '',
      assets: [],
      script: '',
      js: [],
      style: '',
      css: [],
      theme: defaultThemes,
      includeHidden: false,
      clearOutput: false,
      quiet: false,
      debug: false,
      ...options,
    };

    // string format implies embed
    if (this.options.format === 'string')
    {
      this.options.embed = true;
      this.options.inheritTitle = true;
      this.options.output = options.output ? options.output : 'index.html';
    }
    // validate the input and options based on input
    else
    {
      this.options.input = path.resolve(options.input);
      if (!fs.existsSync(this.options.input))
      {
        this.error(`Input does not exist [${this.options.input}]`);
        return;
      }
      // add the assets if it exists in the input directory
      if (options.assets === undefined && fs.existsSync(path.resolve(this.inputDir, 'assets')))
        this.options.assets = ['assets'];
      // resolve output
      this.options.output = path.resolve(this.options.output);
    }
    
    this.setTheme();
    this.checkFavicon();
    this.checkCss();
    this.checkJs();
    this.checkExcluded();
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
   * Checks to see if the path is excluded.
   * @param path the path to check for exclusion
   * @returns true if the path is excluded, false otherwise
   */
  public isExcluded(path:string):boolean
  {
    if (!this.options.exclude) return false;
    for(const exclude of this.options.exclude as string[])
      if (path.indexOf(exclude) !== -1) 
        return true;
    return false;
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
        this.warning(`Given file is not relative to input directory [${file}]`);
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
    if (!Array.isArray(this.options.exclude)) 
      this.options.exclude = [this.options.exclude];
    this.options.exclude = this.filterRelative(this.options.exclude);
  }
  /**
   * Checks the validity of the js files
   */
  private checkJs()
  {
    if (!Array.isArray(this.options.js)) this.options.js = [this.options.js];
    this.options.js = this.filterRelative(this.options.js);
  }
  /**
   * Checks the validity of the css files
   */
  private checkCss()
  {
    if (!Array.isArray(this.options.css)) this.options.css = [this.options.css];
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
      this.warning(`Given favicon is not relative to the input directory [${this.options.favicon}]`);
      this.options.favicon = '';
    }
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
   * Generates the documentation with the current options
   */
  public generate():string|undefined
  {
    this.startTime = process.hrtime();
    const out = new Generator(this).generate();
    const end = process.hrtime(this.startTime);
    const ms = end[0] * 1000 + end[1] / 1000000;
    this.log('Elapsed Time:', timeFormat(ms, {fixed: 2}));
    return out;
  }

  /**
   * @returns true if the input given is a single file
   */
  public get isInputFile() { return fs.lstatSync(this.input).isFile(); }
  /**
   * @returns true if the input given is a string
   */
  public get isInputString() { return this.options.format === 'string'; }
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
      const color = ol.color ? ol.color : 
        (ol.error ? colors.red : colors.green);
      if (ol.error)
      { 
        if (ol.label) console.error(color(ol.label), ...args);
        else console.error(...args);
      }
      else
      { 
        if (ol.label) console.log(color(ol.label), ...args);
        else console.log(...args);
      }
      // check if we should exit
      if (ol.error && ol.error.exit === true)
        process.exit(ol.error.code);
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
   * Use in place of console.error so the app can handle coloring
   * and any cli options that were given. Also will exit with code 1.
   */
  public error(...args:any[])
  {
    this.log(
      { 
        label: 'Error:', 
        color: colors.red, 
        error: { exit: true, code: 1 },
      }, 
      ...args
    );
  }
}