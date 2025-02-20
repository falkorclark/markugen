
import path from 'node:path';
import fs from 'fs-extra';
import colors from 'colors';
import Markugen, { MarkugenOptions } from './markugen';
import { Marked } from 'marked';
import markedAlert from 'marked-alert';
import { createDirectives, presetDirectiveConfigs } from 'marked-directive';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import markedDocument from './extensions/markeddocument';
import markedLinks from './extensions/markedlinks';
import markedCommands from './extensions/markedcommands';
import { tabsDirective } from './extensions/tabdirectives';
import markedCopySaveCode from './extensions/markedcopysavecode';
import { Page, PageConfig, Sitemap } from './page';
import { defaultThemes, Themes } from './themes';
import { Preprocessor } from './preprocessor';
import { HtmlOptions } from './htmloptions';
import Generator from './generator';

export * from './themes';
export * from './preprocessor';
export * from './page';
export * from './htmloptions';

interface MarkdownEntry 
{
  path:string,
  entry:string,
  md?:string,
}

interface Asset
{
  input:string,
  output:string,
  copy?:boolean,
  file?:boolean,
  expand?:boolean,
}
const EmptyAsset:Asset = { input: '', output: '' };

interface Assets
{
  css:Asset[],
  js:Asset[],
  assets:Asset[],
  favicon:Asset,
}

export default class HtmlGenerator extends Generator
{
  /**
   * The name of the markugen generated files
   */
  public static readonly markugenFiles = {
    js: { out: 'markugen.js', template: 'markugen.template.js' },
    css: { out: 'markugen.css', template: 'markugen.template.css' },
  };
  /**
   * Regular expression used for Markugen commands
   */
  public static readonly cmdRegex:RegExp = /\s*(?<esc>[\\]?)markugen\. *(?<cmd>[a-z_0-9]+) +(?<args>.+)/i;
  /**
   * Used to generate ids the same each time
   */
  public static globalId:number = 1;

  /**
   * Contains the options that were given on construction
   */
  public readonly options:Required<HtmlOptions>;
  /**
   * Path to the templates
   */
  public readonly templates:string;
  /**
   * Generated sitemap
   */
  private sitemap:Sitemap = {
    name: 'sitemap', 
    title: 'Markugen v' + Markugen.version, 
    toc: 3,
    footer: '',
    home: '',
  };
  /**
   * The html files that were generated
   */
  private generated:string[] = [];
  /**
   * JavaScript to embed in each page
   */
  private script:string = '';
  /**
   * CSS to embed in each page
   */
  private style:string = '';
  /**
   * Assets to copy over
   */
  private assets:Assets = { css: [], js: [], assets: [], favicon: EmptyAsset };
  /**
   * The preprocessor to use for template expansion
   */
  private preprocessor:Preprocessor;

  /**
   * Constructs a new generator with the given markugen options
   */
  public constructor(mark:Markugen, options:HtmlOptions & MarkugenOptions)
  {
    super(mark, options);
    this.options = {
      input: options.input,
      format: options.format ?? 'file',
      extensions: options.extensions ?? ['md'],
      outputFormat: options.outputFormat ?? 'file',
      output: path.resolve(options.output ?? './output'),
      outputName: options.outputName ?? '',
      pdf: options.pdf ?? false,
      pdfOnly: options.pdfOnly ?? false,
      exclude: options.exclude ?? [],
      title: options.title ?? 'Markugen v' + Markugen.version,
      inheritTitle: options.inheritTitle ?? false,
      footer: options.footer ?? '',
      timestamp: options.timestamp ?? true,
      home: options.home ?? '',
      toc: options.toc ?? 3,
      embed: options.embed ?? false,
      favicon: options.favicon ?? '',
      assets: options.assets ?? [],
      keepAssets: options.keepAssets ?? false,
      script: options.script ?? '',
      js: options.js ?? [],
      style: options.style ?? '',
      css: options.css ?? [],
      theme: options.theme ?? defaultThemes,
      vars: options.vars ?? {},
      includeHidden: options.includeHidden ?? false,
      clearOutput: options.clearOutput ?? false,
    };
    
    // unescape newlines provided in the string
    if (options.format === 'string' && options.cli === true) 
      this.options.input = options.input.replace(/\\n/g, '\n');

    this.templates = path.resolve(mark.root, 'templates');
    if (!fs.existsSync(this.templates)) 
      throw Error(`Unable to locate templates directory [${this.templates}]`);
    // create the preprocessor
    this.preprocessor = new Preprocessor(this);
    // validate the options
    this.validate();
  }

  /**
   * Generates the documentation.
   * @returns the paths to all generated pages, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public generate():string|string[]|undefined
  {
    this.start();

    // prepares for generation
    this.prepare();
    let result = this.writeChildren(this.sitemap);

    // result should be the home file path
    if (this.options.outputFormat === 'file')
      result = path.resolve(this.output, this.sitemap.home);

    this.finish();

    // output to the console if cli and output format of string
    if (this.options.outputFormat === 'string' && result) console.log(result);

    // return the result
    return this.options.outputFormat === 'string' ? result : this.generated;
  }

  /**
   * Clears all assets from the last run
   */
  public clearAssets()
  {
    // clear the assets
    const temp:Asset[] = [];
    for (const assets of Object.values(this.assets))
    {
      if (Array.isArray(assets)) temp.push(...assets);
      else temp.push(assets);
    }
    for(const asset of temp)
    {
      const full = path.resolve(this.output, asset.output);
      if (fs.existsSync(full)) fs.removeSync(full);
    }
  }
  
  /**
   * @returns true if the input given is a single file
   */
  public get isInputFile() 
  { 
    return fs.existsSync(this.input) && fs.lstatSync(this.input).isFile(); 
  }
  /**
   * @returns true if the input given is a string
   */
  public get isInputString() { return this.options.format === 'string'; }
  /**
   * @returns true if the input is a string or file
   */
  public get isInputSolo() { return this.isInputString || this.isInputFile; }
  /**
   * @returns the path to the input or the string input
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
   * Validates the options and makes changes where necessary
   */
  protected validate()
  {
    // must have at least one extension
    if (this.options.extensions.length < 1) this.options.extensions.push('md');

    // pdfOnly implies pdf
    if (this.options.pdfOnly) this.options.pdf = true;

    // pdf implies output format of file
    if (this.options.pdf && this.options.outputFormat === 'string')
    {
      this.warning(`Output format changing to ${colors.green('file')} for PDF generation`);
      this.options.outputFormat = 'file';
    }

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
    if (this.options.pdf && !this.mark.options.browser) 
      this.mark.options.browser = Markugen.findChrome() ?? '';
    if (this.options.pdf && 
      (!this.mark.options.browser || !fs.existsSync(this.mark.options.browser))
    )
    {
      throw new Error(`Unable to locate browser at [${this.mark.options.browser}], cannot generate PDFs`);
    }

    // output string only valid for input string
    if (this.options.outputFormat === 'string' && !this.isInputFile && this.options.format !== 'string')
      throw new Error('Output format can only be string if input is a string or a file');

    // string format implies embed
    if (this.options.format === 'string' || this.options.outputFormat === 'string')
      this.options.embed = true;
    
    // solo input implies inherit title
    if (this.isInputSolo) this.options.inheritTitle = true;

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
    this.checkAssets();
    this.checkExcluded();

    // quiet mode if string output
    if (this.options.outputFormat === 'string' && !this.options.pdf) 
      this.mark.options = {...this.mark.options, quiet: true };
  }

  /**
   * Checks that the files are relative to the input directory and filters
   * out the ones that are not. Also resolves each path.
   * @param paths the file(s) to check for relativeness
   * @param file if true, checks that the input is a file
   * @returns the file(s) with non-existing removed and fully resolved paths
   */
  private filterInput(paths:string|string[], file:boolean = false):string[]
  {
    const isArray = Array.isArray(paths);
    const temp:string[] = isArray ? paths : [paths];
    const filtered:string[] = [];
    for(const p of temp)
    {
      if (!p) continue;
      
      const resolved = path.isAbsolute(p) ? path.normalize(p) : path.resolve(this.inputDir, p);
      if (!fs.existsSync(resolved)) 
      {
        this.warning(`Given file or folder does not exist [${colors.red(p)}]`);
      }
      else if (file)
      {
        const stat = fs.statSync(resolved);
        if (stat.isFile()) filtered.push(resolved);
        else this.warning(`Given input must be a file [${colors.red(p)}]`);
      }
      else filtered.push(resolved);
    }
    return filtered;
  }

  /**
   * Checks the validity of the excluded files
   */
  private checkExcluded()
  {
    // assets should be excluded
    for (const ass of this.options.assets) this.options.exclude.push(ass);
    this.options.exclude = this.filterInput(this.options.exclude);
  }
  /**
   * Checks the validity of the assets
   */
  private checkAssets()
  {
    this.assets = { css: [], js: [], assets: [], favicon: EmptyAsset };
    this.resolveAssets(
      this.filterInput(this.options.js, true), 
      this.assets.js, !this.options.embed, true
    );
    this.resolveAssets(
      this.filterInput(this.options.css, true), 
      this.assets.css, !this.options.embed, true
    );
    this.resolveAssets(
      this.filterInput(this.options.favicon, true), 
      this.assets.favicon
    );
    this.resolveAssets(
      this.filterInput(this.options.assets), 
      this.assets.assets
    );
  }
  /**
   * Resolves the paths and stats on assets
   * @param assets the assets to filter
   * @param where where to place the resolved assets
   * @param copy whether these assets should be copied
   */
  private resolveAssets(assets:string|string[], where:Asset|Asset[], 
    copy:boolean = true, expand:boolean = false)
  {
    const isArray = Array.isArray(assets);
    const temp:string[] = isArray ? assets : [assets];
    for (const asset of temp)
    {
      const a:Asset = { input: asset, output: '', copy: copy, expand: expand };
      const stat = fs.statSync(asset);
      a.file = stat.isFile();

      const rel = path.relative(this.inputDir, asset);
      // not relative to input dir
      if (rel.startsWith('..')) a.output = path.basename(asset);
      // relative to input directory
      else a.output = rel;

      if (Array.isArray(where)) where.push(a);
      else
      {
        where.input = a.input;
        where.output = a.output;
        where.copy = a.copy;
        where.expand = a.expand;
        where.file = a.file;
      }
    }
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
   * Prepares the generator
   */
  private prepare()
  {
    this.sitemap.title = this.options.title;
    this.sitemap.toc = this.options.toc;
    this.sitemap.home = this.options.home;
    this.sitemap.children = {};
    this.style = '';
    this.script = '';
    this.generated = [];

    // collect all of the children and build the sitemap
    if (!this.addChildren(this.inputDir, this.sitemap))
      throw new Error(`No markdown files found in [${colors.red(this.inputDir)}]`);

    // set home to the first child with a page
    if (!this.sitemap.home && this.sitemap.children)
    {
      for (const child in this.sitemap.children)
      {
        if (this.sitemap.children[child].href)
        {
          this.sitemap.home = this.sitemap.children[child].href;
          break;
        }
      }
    }

    // clear and create the output directory
    if (this.clearOutput && fs.existsSync(this.output))
    {
      this.log('Clearing Output:', this.output);
      fs.removeSync(this.output);
    }

    // create the directory
    if (!fs.existsSync(this.output)) fs.ensureDirSync(this.output);

    // copy the assets over
    this.writeAssets();
  }

  /**
   * Copies the assets to the output directory
   */
  private writeAssets()
  {
    this.group(colors.green('Writing:'), 'assets');
    for(const asset of this.assets.assets) this.writeAsset(asset);
    this.writeAsset(this.assets.favicon);
    this.writeScripts();
    this.writeStyles();
    this.groupEnd();
  }
  /**
   * Copies a single asset to the output directory
   * @param asset the asset to copy
   */
  private writeAsset(asset:Asset)
  {
    if (asset.input && asset.output && asset.copy)
    {
      try 
      { 
        this.log(asset.expand ? 'Expand:' : 'Copy:', asset.input);
        const out = path.join(this.output, asset.output);
        const dir = path.join(this.output, asset.file ? path.dirname(asset.output) : asset.output);
        fs.ensureDirSync(dir);
        if (!asset.expand) fs.copySync(asset.input, out);
        else
        {
          const text = fs.readFileSync(asset.input, {encoding:'utf8'});
          fs.writeFileSync(out, this.preprocessor.process(text, asset.input));
        }
      }
      catch(e:any) 
      { 
        this.warning(
          `Unable to access asset [${colors.red(asset.input)}]`,
          this.mark.options.debug ? `\n${e.stack}` : undefined,
        ); 
      }
    }
  }
  /**
   * Writes and sets the styles
   */
  private writeScripts()
  {
    // write out the sitemap
    const temp = path.resolve(this.templates, HtmlGenerator.markugenFiles.js.template);
    this.preprocessor.vars.sitemap = this.removeInput(structuredClone(this.sitemap));
    this.script = this.preprocessor.process(
      `${fs.readFileSync(temp, {encoding: 'utf8'})}\n${this.options.script}`, 
      temp
    );
    if (!this.options.embed)
    {
      const file = HtmlGenerator.markugenFiles.js.out;
      const full = path.resolve(this.output, file);
      fs.writeFileSync(full, this.script);

      // expand the js assets
      for (const asset of this.assets.js) this.writeAsset(asset);

      // the markugen script must be first
      this.assets.js = [{ input: temp, output: file, file: true }, ...this.assets.js];
      this.script = '';
    }
    else
    {
      // embed js from files
      if (this.assets.js)
      {
        for (const asset of this.assets.js)
        {
          try 
          { 
            const text = fs.readFileSync(asset.input, {encoding:'utf8'});
            this.script += '\n' + this.preprocessor.process(text, asset.input) + '\n'; 
          }
          catch(e:any) 
          { 
            this.warning(
              `Given js file cannot be read [${colors.red(asset.input)}]`,
              this.mark.options.debug ? `\n${e.stack}` : undefined,
            ); 
          }
        }
        this.assets.js = [];
      }
    }
  }
  /**
   * Writes and sets the styles
   */
  private writeStyles()
  {
    // write out the styles
    const temp = path.resolve(this.templates, HtmlGenerator.markugenFiles.css.template);
    this.preprocessor.vars.theme = {
      light: this.options.theme.light,
      dark: this.options.theme.dark
    };
    this.style = this.preprocessor.process(
      `${fs.readFileSync(temp, {encoding: 'utf8'})}\n${this.options.style}`, 
      temp
    );
    if (!this.options.embed)
    {
      const file = HtmlGenerator.markugenFiles.css.out;
      const full = path.resolve(this.output, file);
      fs.writeFileSync(full, this.style);

      // expand the css assets
      for (const asset of this.assets.css) this.writeAsset(asset);

      this.assets.css.push({ input: temp, output: file, file: true });
      this.style = '';
    }
    else
    {
      // embed styles from files
      if (this.assets.css)
      {
        for (const asset of this.assets.css)
        {
          try 
          { 
            const text = fs.readFileSync(asset.input, {encoding:'utf8'});
            this.style += '\n' + this.preprocessor.process(text, asset.input) + '\n'; 
          }
          catch(e:any) 
          { 
            this.warning(
              `Given css file cannot be read [${colors.red(asset.input)}]`,
              this.mark.options.debug ? `\n${e.stack}` : undefined,
            ); 
          }
        }
      }
      this.assets.css = [];
    }
  }

  /**
   * Removes the input key from the given page
   * @param page the page to update
   * @returns the page with the key removed
   */
  private removeInput(page:Page):Page
  {
    // remove the page's input
    if (page.input !== undefined) page.input = undefined;
    // remove the children's input
    if (page.children) 
    {
      for (const child in page.children) 
        this.removeInput(page.children[child]);
    }
    return page;
  }

  /**
   * Adds the children for the given page in the given directory
   * @param dir the directory to add children from
   * @param parent the parent page
   */
  private addChildren(dir:string, parent:Page):boolean
  {
    parent.children = {};
    // handle single file
    if (this.isInputSolo)
    {
      const input = this.isInputFile ? this.options.input : this.options.outputName + '.md';
      const entry = this.entry(this.inputDir, path.basename(input), true);
      if (entry)
      {
        this.addChild(parent, entry);
        return true;
      }
      return false;
    }

    let mark:PageConfig[] = [];
    // look for config file first
    const mfile = path.resolve(dir, 'markugen.json');
    if (fs.existsSync(mfile))
    {
      try { mark = fs.readJsonSync(mfile); }
      catch(e:any) { this.warning(`${e.message} [${mfile}]`); }
      if (!Array.isArray(mark))
      {
        this.warning(`Configuration must be an array [${colors.red(mfile)}]`);
        mark = [];
      }
    }
    // populate the children from the config
    for(const child of mark)
    {
      const entry = this.entry(dir, child.name);
      if (!entry) this.warning(`Configuration [${colors.red(child.name)}] does not exist [${colors.red(mfile)}]`);
      else this.addChild(parent, entry, child);
    }

    // now get the rest of the files
    const subs:fs.Dirent[] = [];
    const files = fs.readdirSync(dir, {withFileTypes: true});
    for(const file of files)
    {
      const full = path.join(dir, file.name);
      if (this.isExcluded(full)) continue;

      // push directories for later
      if (file.isDirectory()) subs.push(file);
      // add missing children
      else if (file.isFile() && this.isMarkdown(file.name)) 
      {
        const entry = this.entry(dir, file.name, true);
        if (entry) this.addChild(parent, entry);
      }
    }

    // now do the sub directories
    for(const sub of subs)
    {
      const md = this.entry(dir, sub.name);
      if (!md) continue;
      
      const child = this.addChild(parent, md);
      if (child)
      {
        const full = path.join(dir, sub.name);
        // if no children were added, delete the entry
        if (!this.addChildren(full, child))
          delete parent.children[md.entry];
      }
    }

    // return true if the parent has children
    return parent.children && Object.keys(parent.children).length > 0;
  }

  /**
   * Adds a child to the given parent
   * @param parent the parent to add the child to
   * @param entry the entry details for the child
   * @param config the config if it has one
   * @returns the page that was added or already there and the entry name
   */
  private addChild(parent:Page, md:MarkdownEntry, config?:PageConfig):Page
  {
    // init the children
    if (!parent.children) parent.children = {};

    const parts = path.parse(md.path);
    const parentDir = path.relative(this.inputDir, path.dirname(md.path));
    // only add if it is not there
    if (!(md.entry in parent.children))
    {
      const title = this.options.inheritTitle ? this.sitemap.title : this.title(md.path);
      const page:Page = config ? {
        title: title,
        toc: parent.toc,
        ...config,
      } : {
        name: parts.name,
        title: title,
        toc: parent.toc,
      };
      if (md.md)
      {
        const html = this.isInputSolo ? this.options.outputName : parts.name;
        page.input = md.md;
        page.href = path.join(parentDir, html + '.html').replace(/\\/g, '/');
      }
      parent.children[md.entry] = page;
    }
    // return the child
    return parent.children[md.entry];
  }

  /**
   * Returns true if the given file matches the provided extensions
   * @param file the file to check
   * @returns true if the given file matches the provided extensions
   */
  private isMarkdown(file:string):boolean
  {
    const dot = file.lastIndexOf('.');
    // check the extension
    return dot > 0 && 
      dot + 1 < file.length && 
      this.options.extensions.includes(file.slice(dot + 1));
  }

  /**
   * Looks for a file matching the given name in the given directory
   * @param dir the parent directory to look in
   * @param name the name of the file to look for
   * @returns details about the file if found
   */
  private entry(dir:string, name:string, precheck?:boolean):MarkdownEntry|undefined
  {
    const test = path.join(dir, name);
    const entry = path.relative(this.inputDir, test).replace(/\\/g, '/');

    // just populate if already checked
    if (precheck) return { entry: entry, path: test, md: test };

    // don't even bother if excluded
    if (this.isExcluded(test)) return undefined;

    const isDirectory = fs.existsSync(test) && fs.lstatSync(test).isDirectory();
    // check all extensions first
    for (const ext of this.options.extensions)
    {
      const file = `${test}.${ext}`;
      if (fs.existsSync(file)) 
      {
        const entry = path.relative(this.inputDir, file).replace(/\\/g, '/');
        return { entry: entry, path: isDirectory ? test : file, md: file };
      }
    }

    // check for a directory if the file is not there
    return isDirectory ? { entry: entry, path: test } : undefined;
  }

  /**
   * Creates the html for the children of the given page
   * @param parent the parent page
   * @returns the html or file path for the first child
   */
  private writeChildren(parent:Page):string|undefined
  {
    let html:string|undefined = undefined;
    // only need to write out children here
    if (parent.children)
    {
      for(const child in parent.children)
      {
        // write out the first child
        if (parent.children[child].href)
        {
          const temp = this.writeHtml(parent.children[child]);
          // return the first page's html or file path
          if (!html) html = temp;
        }
        // write the children out
        if (parent.children[child].children) 
          this.writeChildren(parent.children[child]);
      }
    }
    return html;
  }

  /**
   * Creates the html file for the given page
   * @param page the page for the markdown file
   * @returns the file path or the html as a string, undefined 
   * if nothing was created
   */
  private writeHtml(page:Page):string|undefined
  {
    // only pages with hrefs have an html page
    if (!page.href) return undefined;

    let depth = '';
    let dir = this.output;
    const subs = page.href.split(/\//g);
    for(let i = 0; i < subs.length - 1; i++) 
    {
      dir = path.join(dir, subs[i]);
      fs.ensureDirSync(dir);
      depth = '../' + depth;
    }

    if (!page.input) return undefined;
    const file = path.join(this.output, page.href);
    const md = this.isInputString ? file : page.input;
    const text = this.isInputString ? this.input : fs.readFileSync(md, {encoding: 'utf8'});
    this.group(colors.green('Generating:'), file);

    // create marked and extensions
    const marked = new Marked(
      markedAlert(),
      createDirectives([
        ...presetDirectiveConfigs,
        tabsDirective,
      ]),
      gfmHeadingId(),
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) 
        {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        }
      }),
      markedCopySaveCode(),
      markedCommands({
        file: md,
        generator: this,
      }),
      markedLinks(),
      markedDocument({
        title: page.title,
        style: this.style,
        script: this.script,
        css: this.assets.css.map((asset) => depth + asset.output),
        js: this.assets.js.map((asset) => depth + asset.output),
        link: this.assets.favicon.output ? {
          href: depth + this.assets.favicon.output, 
          rel: 'icon', 
          sizes: 'any',
          type: 'image/x-icon',
        } : undefined,
      }),
    );

    const html:string = marked.parse(this.preprocessor.process(text, md)) as string;
    fs.writeFileSync(file, html);
    this.generated.push(file);
    this.groupEnd();

    // return the file path or html
    return this.options.outputFormat === 'file' ? file : html;
  }

  /**
   * @returns the title for the given file or directory
   */
  private title(file:string)
  {
    return path.parse(file).name.replace(/[-_.]/g, ' ');
  }
}