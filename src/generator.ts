
import path from 'node:path';
import fs from 'node:fs';
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
import puppeteer, { Browser, ElementHandle, Page as PuppeteerPage } from 'puppeteer';
import { replaceLast } from './utils';

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
   * The name of the markugen generated files
   */
  public static readonly files = {
    js: 'markugen.js',
    css: 'markugen.css',
  };
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
   * Puppeteer browser instance and page if generating PDFs
   */
  private puppeteer?:{ browser:Browser, page:PuppeteerPage };

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
  public async generate():Promise<string|undefined>
  {
    // prepares for generation
    await this.prepare();
    // generate the output
    const result = this.mark.isInputString ? await this.generateString() : await this.generateFiles();
    // remove additional files if only pdf generation
    await this.cleanup();
    // return the result
    return result;
  }

  /**
   * Prepares the generator
   */
  private async prepare()
  {
    this.sitemap.title = this.mark.options.title;
    this.sitemap.toc = this.mark.options.toc;
    this.sitemap.home = this.mark.options.home;
    this.sitemap.children = {};
    this.style = undefined;
    this.script = undefined;
    this.assets = [];
    if (this.mark.options.pdf)
    {
      const browser = await puppeteer.launch();
      this.puppeteer = {
        browser: browser,
        page: await browser.newPage(),
      };
    }
  }

  /**
   * Cleans up generated output when pdfOnly is set
   */
  private async cleanup()
  {
    // close browser
    if (this.puppeteer)
    {
      await this.puppeteer.browser.close();
      this.puppeteer = undefined;
    }
    // delete generated files
    if (this.mark.options.pdfOnly)
    {
      for (const file of this.js)
      {
        const full = path.resolve(this.mark.output, file);
        if (fs.existsSync(full)) shell.rm('-rf', full);
      }
      for (const file of this.css)
      {
        const full = path.resolve(this.mark.output, file);
        if (fs.existsSync(full)) shell.rm('-rf', full);
      }
    }
  }

  /**
   * Generates a string of HTML
   * @returns the HTML string
   */
  private async generateString():Promise<string|undefined>
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
    return this.sitemap.children ? await this.writeHtml(this.sitemap.children[name + '.md']) : undefined;
  }
  /**
   * Generates the documentation to the output folder as files
   * @returns the path to the home page or undefined if an error occurred
   */
  private async generateFiles():Promise<string|undefined>
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
    await this.writeChildren(this.sitemap);
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
    const temp = path.resolve(this.templates, 'markugen.template.js');
    this.script = fs.readFileSync(temp, {encoding: 'utf8'});
    this.mark.preprocessor.vars.sitemap = this.sitemap;
    this.script = this.mark.preprocessor.process(this.script, temp);
    if (!this.mark.options.embed)
    {
      const file = Generator.files.js;
      fs.writeFileSync(
        path.resolve(this.mark.output, file), 
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
    const temp = path.resolve(this.templates, 'markugen.template.css');
    this.style = fs.readFileSync(temp, {encoding: 'utf8'});
    this.mark.preprocessor.vars.theme = {
      light: this.mark.options.theme.light,
      dark: this.mark.options.theme.dark
    };
    this.style = this.mark.preprocessor.process(this.style, temp);
    if (!this.mark.options.embed)
    {
      const file = Generator.files.css;
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
        title: this.mark.options.inheritTitle ? this.sitemap.title : this.title(name),
        toc: parent.toc,
        ...config 
      } : {
        name: name,
        title: this.mark.options.inheritTitle ? this.sitemap.title : this.title(name),
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
          page.children[child].href = child.replace(/(\\)|(\.md$)/gi, 
            (match:string, p1:string, p2:string) => 
            {
              if (p1) return '/';
              if (p2) return '.html';
              return match;
            }
          );
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
  private async writeChildren(parent:Page)
  {
    // only need to write out children here
    if (parent.children)
    {
      for(const child in parent.children)
      {
        if (parent.children[child].href)
          await this.writeHtml(parent.children[child]);
        if (parent.children[child].children) 
          await this.writeChildren(parent.children[child]);
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
    if (this.mark.options.style) styles += '\n' + this.mark.options.style + '\n';
    // embed styles from files
    if (this.mark.options.css)
    {
      const files = Array.isArray(this.mark.options.css) ? this.mark.options.css : [this.mark.options.css];
      for (const file of files)
      {
        if (URL.canParse(file)) continue;
        try 
        { 
          styles += '\n' + fs.readFileSync(file, {encoding:'utf8'}) + '\n'; 
        }
        catch(e) 
        { 
          this.mark.warning(`Given css file cannot be read [${file}]`); 
        }
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
      const files = Array.isArray(this.mark.options.js) ? this.mark.options.js : [this.mark.options.js];
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
  private async writeHtml(page:Page):Promise<string|undefined>
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

    const file = this.mark.isInputString ? this.mark.output : path.resolve(this.mark.output, page.href);
    this.mark.group(colors.green('Generating:'), file);
    // full path to markdown file
    const md = this.mark.isInputString ? file : path.resolve(this.mark.inputDir, page.href.replace(/\.html$/, '.md'));
    const text = this.mark.isInputString ? this.mark.input : fs.readFileSync(md, {encoding: 'utf8'});

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
        css: this.css.map((value) => URL.canParse(value) ? value : depth + value),
        js: this.js.map((value) => URL.canParse(value) ? value : depth + value),
        link: this.mark.options.favicon ? {
          href: depth + this.mark.options.favicon, 
          rel: 'icon', 
          sizes: 'any',
          type: 'image/x-icon',
        } : undefined,
      }),
    );

    const html:string = marked.parse(this.mark.preprocessor.process(text, md)) as string;
    if (!this.mark.isInputString)
    {
      fs.writeFileSync(file, html);
      await this.writePdf(file, html);
    }
    this.mark.groupEnd();

    // return the file path or the html
    return this.mark.isInputString ? html : file;
  }

  /**
   * Creates the pdf version of the file
   * @param file the path to the html file
   */
  private async writePdf(file:string, html:string)
  {
    if (!this.mark.options.pdf || !this.puppeteer) return;
      
    try
    {
      const pdf = file.replace(/\.html$/, '.pdf');
      this.mark.log('Generating PDF:', pdf);
      await this.puppeteer.page.goto(file, { waitUntil: 'networkidle2' });

      // replace all markdown relative links with the pdf equivalent
      await this.puppeteer.page.evaluate(() =>
      {
        const links = document.querySelectorAll('.markugen-md-link');
        for(const link of links)
        {
          // @ts-ignore
          const matches = link.href.matchAll(/\.html/ig);
          // get the last match
          let match = undefined; for (const m of matches) match = m;
          if (match)
          {
            const lastIndex = match.index;
            const length = match[0].length;
            // @ts-ignore
            link.href = `${link.href.slice(0, lastIndex)}.pdf${link.href.slice(lastIndex + length)}`;
          }
        }
      });

      // get the content box
      const content = await this.puppeteer.page.$('#markugen-content');
      const box = await content?.boxModel();

      await this.puppeteer.page.pdf({ 
        path: pdf, 
        margin: {
          left: box?.content[0].x ?? '25px',
          right: box?.content[3].x ?? '25px',
        },
        displayHeaderFooter: false,
      });
      // remove the html file if pdf only
      if (this.mark.options.pdfOnly) fs.rmSync(file);
    }
    catch(e:any) { this.mark.error(e); }
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