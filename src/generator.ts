
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import shell from 'shelljs';
import colors from 'colors';
import Markugen from './markugen';

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

export interface PageConfig 
{
  name:string,
  toc?:number,
  title?:string,
  collapsible?:boolean,
}

export interface Page extends PageConfig 
{
  href?:string, 
  children?: Record<string, Page>,
}

export interface Sitemap extends Page 
{
  home:string,
  footer:string,
}

export default class Generator
{
  /**
   * Instance of Markugen
   */
  public readonly mark:Markugen;
  /**
   * Path to the templates
   */
  public readonly templates:string;
  /**
   * Generated sitemap
   */
  public readonly sitemap:Sitemap;
  
  /**
   * JavaScript to embed in each page
   */
  private script?:string;
  /**
   * Extra js files to include
   */
  private js:string[] = [];
  /**
   * CSS to embed in each page
   */
  private style?:string;
  /**
   * Extra css files to include
   */
  private css:string[] = [];
  /**
   * Assets to copy over
   */
  private assets:string[] = [];

  /**
   * Constructs a new generator with the given markugen options
   */
  public constructor(mark:Markugen)
  {
    this.mark = mark;
    this.sitemap = { 
      name: 'sitemap', 
      title: mark.options.title, 
      toc: mark.options.toc,
      footer: mark.options.footer,
      home: '',
    };
    this.templates = path.resolve(mark.root, 'templates');
    if (!fs.existsSync(this.templates)) 
      throw Error(`Unable to locate templates directory [${this.templates}]`);
  }

  /**
   * Generates the documentation
   * @returns the path to the home page, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public generate():string|undefined
  {
    this.sitemap.title = this.mark.options.title;
    this.sitemap.toc = this.mark.options.toc;
    this.sitemap.home = this.mark.options.home;
    this.sitemap.children = {};
    this.style = undefined;
    this.script = undefined;
    this.assets = [];

    // handle string generation
    if (this.mark.isInputString) return this.generateString();
    // else we are generating files
    return this.generateFiles();
  }

  private generateString():string|undefined
  {
    const name = this.mark.options.output.replace(/\.html$/i, '');
    this.sitemap.home = this.mark.options.output;
    this.addChild(this.sitemap, name + '.md', name);
    // write and set the styles
    this.writeStyles();
    // write and set the scripts
    this.writeScripts();
    // set the hrefs
    this.setHrefs(this.sitemap);
    // create the html
    return this.sitemap.children ? this.writeHtml(this.sitemap.children[name + '.md']) : undefined;
  }
  /**
   * Generates the documentation to the output folder as files
   * @returns the path to the home page or undefined if an error occurred
   */
  private generateFiles():string|undefined
  {
    // collect all of the children and build the sitemap
    if (!this.addChildren(this.mark.inputDir, this.sitemap))
    {
      this.mark.error(`No markdown files found in [${this.mark.inputDir}]`);
      return undefined;
    }
    // set the hrefs
    this.setHrefs(this.sitemap);

    // clear and create the output directory
    if(fs.existsSync(this.mark.output) && this.mark.clearOutput)
    {
      this.mark.log('Clearing Output:', this.mark.output);
      shell.rm('-rf', this.mark.output);
    }
    shell.mkdir('-p', this.mark.output);

    // write and set the styles
    this.writeStyles();
    // write and the the scripts
    this.writeScripts();

    // copy the assets over
    this.copyAssets();

    // write the html files
    this.mark.group(colors.green('Generating:'), 'html');
    this.writeChildren(this.sitemap);
    this.mark.groupEnd();
    const home = path.resolve(this.mark.output, this.sitemap.home);
    this.mark.log('Generating Finished:', home);
    return home;
  }

  /**
   * Writes and sets the styles
   */
  private writeScripts()
  {
    // write out the sitemap
    this.script = fs.readFileSync(path.resolve(this.templates, 'markugen.template.js'), {encoding: 'utf8'});
    this.script = this.script.replace(/{{ *((sitemap)|(markugen)) *}}/gi, (match:string, p1?:string, p2?:string, p3?:string) => 
{
      if (p2) return JSON.stringify(this.sitemap, null, 2);
      if (p3)
      {
        return JSON.stringify({
          version: Markugen.version,
          name: Markugen.name,
          date: new Date(),
          platform: os.platform() === 'win32' ? 'windows' : 'linux',
        }, null, 2);
      }
      return match;
    });
    if (!this.mark.options.embed)
    {
      const file = 'markugen.js';
      fs.writeFileSync(path.resolve(this.mark.output, 'markugen.js'), 
        this.script + (this.mark.options.script ? this.mark.options.script : '')
      );
      this.js.push(file);
      if (Array.isArray(this.mark.options.js))
      {
        this.js.push(...this.mark.options.js);
        this.assets.push(...this.mark.options.js);
      }
      this.script = undefined;
    }
  }
  /**
   * Writes and sets the styles
   */
  private writeStyles()
  {
    // write out the styles
    this.style = fs.readFileSync(path.resolve(this.templates, 'markugen.template.css'), {encoding: 'utf8'});
    this.style = this.style.replace(/{{ *((light)|(dark)) *}}/gi, (match:string, p1?:string, p2?:string, p3?:string) => 
{
      let theme = undefined;
      if (p2) theme = this.mark.options.theme.light;
      if (p3) theme = this.mark.options.theme.dark;
      if (theme)
      {
        return `--markugen-color: ${theme.color};
  --markugen-color-secondary: ${theme.colorSecondary};
  --markugen-bg-color: ${theme.bgColor};
  --markugen-bg-color-secondary: ${theme.bgColorSecondary};
  --markugen-accent-color: ${theme.accentColor};
  --markugen-border-color: ${theme.borderColor};
  --markugen-border-color-secondary: ${theme.borderColorSecondary};
  --markugen-font-family: ${theme.fontFamily};
  --markugen-font-family-headers: ${theme.fontFamilyHeaders};`;
      }
      return match;
    });
    if (!this.mark.options.embed)
    {
      const file = 'markugen.css';
      fs.writeFileSync(path.resolve(this.mark.output, file), 
        this.style + (this.mark.options.style ? this.mark.options.style : '')
      );
      this.css.push(file);
      if (Array.isArray(this.mark.options.css))
      {
        this.css.push(...this.mark.options.css);
        this.assets.push(...this.mark.options.css);
      }
      this.style = undefined;
    }
  }

  /**
   * Copies the assets to the output directory
   */
  private copyAssets()
  {
    if (this.mark.options.assets)
    {
      if (Array.isArray(this.mark.options.assets)) 
        this.assets.push(...this.mark.options.assets);
      else this.assets.push(this.mark.options.assets);
    }
    if (this.mark.options.favicon) this.assets.push(this.mark.options.favicon);

    if (this.assets.length > 0) 
      this.mark.group(colors.green('Copying:'), 'assets');
    for(const asset of this.assets) 
    {
      // don't copy URLs
      if (URL.canParse(asset)) continue;

      const file = path.resolve(this.mark.inputDir, asset);
      if (fs.existsSync(file))
      {
        const stat = fs.statSync(file);
        let out = this.mark.output;
        // include directory structure with files
        if (stat.isFile())
        {
          out = path.resolve(this.mark.output, path.dirname(asset));
          shell.mkdir('-p', out);
        }
        this.mark.log('Copy:', file);
        shell.cp('-urf', file, out);
      }
      else this.mark.warning(`Given asset does not exist [${file}]`);
    }
    if (this.assets.length > 0) this.mark.groupEnd();
  }

  /**
   * Adds the children for the given page in the given directory
   * @param dir the directory to add children from
   * @param parent the parent page
   */
  private addChildren(dir:string, parent:Page):boolean
  {
    parent.children = {};
    let mark:PageConfig[] = [];

    // look for config file first
    const mfile = path.resolve(dir, 'markugen.json');
    if (fs.existsSync(mfile))
    {
      try { mark = JSON.parse(fs.readFileSync(mfile, {encoding: 'utf8'})); }
      catch(e:any) { this.mark.warning(e.toString(), `[${mfile}]`); }
      if (!Array.isArray(mark))
      {
        this.mark.warning(`Configuration must be an array [${mfile}]`);
        mark = [];
      }
    }
    // populate the children from the config
    for(const child of mark)
    {
      let file:string|undefined = path.resolve(dir, child.name + '.md');
      if (this.mark.isExcluded(file)) file = undefined;
      else if (!fs.existsSync(file))
      {
        file = path.resolve(dir, child.name);
        if (!fs.existsSync(file))
        {
          file = undefined;
          this.mark.warning(`Configuration [${child.name}] does not exist [${mfile}]`);
        }
      }
      // markdown file exists
      if (file) this.addChild(
        parent, 
        path.relative(this.mark.inputDir, file), 
        child.name, 
        child
      );
    }

    // handle single file
    if (this.mark.isInputFile)
    {
      const name = path.basename(this.mark.input);
      this.addChild(parent, name, name);
      // delete any extra keys
      const keys = Object.keys(parent.children);
      for (const key of keys) if (key !== name) delete parent.children[key];
      return true;
    }

    // now get the rest of the files
    const subs:fs.Dirent[] = [];
    const files:fs.Dirent[] = fs.readdirSync(dir, {withFileTypes: true});
    for(const file of files)
    {
      const fullpath = path.resolve(file.parentPath, file.name);
      if (this.mark.isExcluded(fullpath) || (!this.mark.options.includeHidden && file.name.startsWith('.'))) 
        continue;
      // push directories for later
      if (file.isDirectory()) subs.push(file);
      // add missing children
      else if (file.isFile() && /\.md$/i.test(file.name))
      { 
        const entry = path.relative(this.mark.inputDir, fullpath);
        this.addChild(parent, entry, file.name);
      }
      
    }
    // now do the sub directories
    for(const sub of subs)
    {
      const full = path.resolve(sub.parentPath, sub.name);
      const rel = path.relative(this.mark.inputDir, full);
      let entry = rel + '.md';
      if (!(entry in parent.children))
      {
        entry = rel;
        this.addChild(parent, entry, sub.name);
      }
      // if no children were added, delete the entry
      if (!this.addChildren(full, parent.children[entry]))
        delete parent.children[entry];
    }

    // return true if the parent has children
    return parent.children && Object.keys(parent.children).length > 0;
  }

  /**
   * Adds a child to the given parent
   * @param parent the parent to add the child to
   * @param entry the value to use for the child entry
   * @param name the name of the child
   * @param config the config if it has one
   * @returns the page that was added or already there
   */
  private addChild(parent:Page, entry:string, name:string, config?:PageConfig)
  {
    // init the children
    if (!parent.children) parent.children = {};
    // only add if it is not there
    if (!(entry in parent.children))
    {
      const page:Page = config ? {
        title: this.mark.options.inheritTitle ? 
          this.sitemap.title : this.title(name),
        toc: parent.toc,
        ...config 
      } : {
        name: name,
        title: this.mark.options.inheritTitle ? 
          this.sitemap.title : this.title(name),
        toc: parent.toc,
      };
      parent.children[entry] = page;
    }
    // return the child
    return parent.children[entry];
  }

  /**
   * Sets the href value for the children of the given page
   * @param page the page who's children to set
   */
  private setHrefs(page:Page)
  {
    if (page.children)
    {
      for (const child in page.children) 
      {
        if (/\.md$/i.test(child))
        {
          page.children[child].href = child.replace(/(\\)|(\.md$)/gi, (match:string, p1:string, p2:string) => 
{
            if (p1) return '/';
            if (p2) return '.html';
            return match;
          });
        }
        this.setHrefs(page.children[child]);
      }
      // set the home page
      if (page === this.sitemap && !this.sitemap.home)
      {
        const vals = Object.values(page.children);
        this.sitemap.home = vals.length > 0 && vals[0].href ? vals[0].href : '';
      }
    }
  }

  /**
   * Creates the html for the children of the given page
   * @param parent the parent page
   */
  private writeChildren(parent:Page)
  {
    // only need to write out children here
    if (parent.children)
    {
      for(const child in parent.children)
      {
        if (parent.children[child].href)
          this.writeHtml(parent.children[child]);
        if (parent.children[child].children) 
          this.writeChildren(parent.children[child]);
      }
    }
  }

  /**
   * @returns the styles to embed
   */
  private get styles()
  {
    if (!this.mark.options.embed) return undefined;
    let styles = this.style ? this.style : '';
    // add string styles
    if (this.mark.options.style) 
      styles += '\n' + this.mark.options.style + '\n';
    // embed styles from files
    if (this.mark.options.css)
    {
      const files = Array.isArray(this.mark.options.css) ? 
        this.mark.options.css : [this.mark.options.css];
      for (const file of files)
      {
        if (URL.canParse(file)) continue;
        try 
        { styles += '\n' + fs.readFileSync(file, {encoding:'utf8'}) + '\n'; }
        catch(e) 
        { this.mark.warning(`Given css file cannot be read [${file}]`); }
      }
    }
    return styles === '' ? undefined : styles;
  }

  /**
   * @returns the scripts to embed
   */
  private get scripts()
  {
    if (!this.mark.options.embed) return undefined;
    let scripts = this.script ? this.script : '';
    if (this.mark.options.script) scripts += '\n' + this.mark.options.script + '\n';
    // embed js from files
    if (this.mark.options.js)
    {
      const files = Array.isArray(this.mark.options.js) ? 
        this.mark.options.js : [this.mark.options.js];
      for (const file of files)
      {
        if (URL.canParse(file)) continue;
        try { scripts += '\n' + fs.readFileSync(file, {encoding:'utf8'}) + '\n'; }
        catch(e) { this.mark.warning(`Given js file cannot be read [${file}]`); }
      }
    }
    return scripts === '' ? undefined : scripts;
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
    let dir = this.mark.output;
    const subs = page.href.split(/\//g);
    for(let i = 0; i < subs.length - 1; i++) 
    {
      dir = path.join(dir, subs[i]);
      shell.mkdir('-p', dir);
      depth = '../' + depth;
    }

    const file = this.mark.isInputString ? this.mark.output : 
      path.resolve(this.mark.output, page.href);
    this.mark.group(colors.green('Generating:'), file);
    // full path to markdown file
    const md = this.mark.isInputString ? file : 
      path.resolve(this.mark.inputDir, page.href.replace(/\.html$/, '.md'));
    const text = this.mark.isInputString ? this.mark.input : 
      fs.readFileSync(md, {encoding: 'utf8'});

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
        markugen: this.mark,
      }),
      markedLinks(),
      markedDocument({
        title: page.title,
        style: this.styles,
        script: this.scripts,
        css: this.css.map((value) => 
          URL.canParse(value) ? value : depth + value),
        js: this.js.map((value) => 
          URL.canParse(value) ? value : depth + value),
        link: this.mark.options.favicon ? {
          href: depth + this.mark.options.favicon, 
          rel: 'icon', 
          sizes: 'any',
          type: 'image/x-icon',
        } : undefined,
      }),
    );

    const html:string = marked.parse(text) as string;
    if (!this.mark.isInputString) fs.writeFileSync(file, html);
    this.mark.groupEnd();

    // return the file path or the html
    return this.mark.isInputString ? html : file;
  }

  /**
   * @returns the title for the given file or directory
   */
  private title(file:string)
  {
    return file.replace(/(^\.+)|(\.md$)|(_|-|\.)/ig, (match, p1, p2) => 
{
      if (p1 || p2) return '';
      return ' ';
    });
  }
}