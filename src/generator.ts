
import path from 'node:path';
import fs from 'fs-extra';
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
import puppeteer, { Browser, Page as PuppeteerPage } from 'puppeteer-core';
import { Page, PageConfig, Sitemap } from './page';
import url from 'url';

export * from './page';

interface MarkdownEntry 
{
  path:string,
  entry:string,
  md?:string,
}

export default class Generator
{
  /**
   * The name of the markugen generated files
   */
  public static readonly markugenFiles = {
    js: { out: 'markugen.js', template: 'markugen.template.js' },
    css: { out: 'markugen.css', template: 'markugen.template.css' },
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
   * The html files that were generated
   */
  public readonly generated:string[] = [];
  
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
      input: '',
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
   * Generates the documentation. This is synchronous and will ignore the 
   * {@link Markugen.options.pdf} flag. If you are generating PDFs, you must
   * use the async version {@link generatePdfs}.
   * @returns the path to the home page, the html if format === 'string', or 
   * undefined if an error occurred
   */
  public generate():string|undefined
  {
    // prepares for generation
    this.prepare();
    // generate the output
    return this.generateHtml();
  }

  /**
   * Generates the documentation as PDFs. If the pdf option is given, this
   * version of the {@link generate} method must be called or the PDFs will
   * not be generated.
   */
  public async generatePdfs():Promise<string|undefined>
  {
    // generate the html first
    const result = this.generate();
    if (!result) return undefined;

    this.mark.group(colors.green('Generating:'), 'pdf');

    // prepare the browser
    this.mark.log('Browser:', this.mark.options.browser);
    const browser = await puppeteer.launch({ 
      executablePath: this.mark.options.browser 
    });
    this.puppeteer = {
      browser: browser,
      page: await browser.newPage(),
    };

    // generate pdfs for all files generated
    for(const file of this.generated)
      if (/\.html$/i.test(file))
        await this.writePdf(file);

    // clean everything up
    await this.cleanup();

    this.mark.groupEnd();
    this.mark.log('Generating Finished:', result.replace(/\.html$/i, '.pdf'));
  }

  /**
   * Prepares the generator
   */
  private prepare()
  {
    this.sitemap.title = this.mark.options.title;
    this.sitemap.toc = this.mark.options.toc;
    this.sitemap.home = this.mark.options.home;
    this.sitemap.children = {};
    this.style = undefined;
    this.script = undefined;
    this.assets = [];
    this.generated.length = 0;

    // collect all of the children and build the sitemap
    if (!this.addChildren(this.mark.inputDir, this.sitemap))
      throw new Error(`No markdown files found in [${colors.red(this.mark.inputDir)}]`);

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
    if (this.mark.clearOutput && fs.existsSync(this.mark.output))
    {
      this.mark.log('Clearing Output:', this.mark.output);
      fs.removeSync(this.mark.output);
    }

    // create the directory
    if (!fs.existsSync(this.mark.output)) fs.ensureDirSync(this.mark.output);

    // write and set the styles
    this.writeStyles();
    // write and the the scripts
    this.writeScripts();
    // copy the assets over
    this.copyAssets();
  }

  /**
   * Cleans up generated output when pdfOnly is set
   */
  private async cleanup()
  {
    this.mark.log('Cleaning:', 'generated files');
    // close browser
    if (this.puppeteer)
    {
      await this.puppeteer.browser.close();
      this.puppeteer = undefined;
    }
    // delete generated files
    if (this.mark.options.pdf)
    {
      for (const file of this.generated) fs.removeSync(file);
      if (!this.mark.options.keepAssets)
        for (const file of this.assets) fs.removeSync(file);
    }
  }

  /**
   * Generates the documentation to the output folder as files
   * @returns the path to the home page or undefined if an error occurred
   */
  private generateHtml():string|undefined
  {
    // write the html files
    this.mark.group(colors.green('Generating:'), 'html');
    let result = this.writeChildren(this.sitemap);

    // result should be the home file path
    if (this.mark.options.outputFormat === 'file')
      result = path.resolve(this.mark.output, this.sitemap.home);

    this.mark.groupEnd();
    this.mark.log('Generating Finished:', result);
    return result;
  }

  /**
   * Writes and sets the styles
   */
  private writeScripts()
  {
    // write out the sitemap
    const temp = path.resolve(this.templates, Generator.markugenFiles.js.template);
    this.script = fs.readFileSync(temp, {encoding: 'utf8'});
    this.mark.preprocessor.vars.sitemap = this.removeInput(structuredClone(this.sitemap));
    this.script = this.mark.preprocessor.process(this.script, temp);
    if (!this.mark.options.embed)
    {
      const file = Generator.markugenFiles.js.out;
      const full = path.resolve(this.mark.output, file);
      fs.writeFileSync(
        full, 
        this.script + (this.mark.options.script ? this.mark.options.script : '')
      );
      this.generated.push(full);
      this.js.push(file);
      this.js.push(...this.mark.options.js);
      this.assets.push(...this.mark.options.js);
      this.script = undefined;
    }
  }
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
   * Writes and sets the styles
   */
  private writeStyles()
  {
    // write out the styles
    const temp = path.resolve(this.templates, Generator.markugenFiles.css.template);
    this.style = fs.readFileSync(temp, {encoding: 'utf8'});
    this.mark.preprocessor.vars.theme = {
      light: this.mark.options.theme.light,
      dark: this.mark.options.theme.dark
    };
    this.style = this.mark.preprocessor.process(this.style, temp);
    if (!this.mark.options.embed)
    {
      const file = Generator.markugenFiles.css.out;
      const full = path.resolve(this.mark.output, file);
      fs.writeFileSync(
        full, 
        this.style + (this.mark.options.style ? this.mark.options.style : '')
      );
      this.css.push(file);
      this.generated.push(full);
      this.css.push(...this.mark.options.css);
      this.assets.push(...this.mark.options.css);
      this.style = undefined;
    }
  }

  /**
   * Copies the assets to the output directory
   */
  private copyAssets()
  {
    if (this.mark.options.assets) this.assets.push(...this.mark.options.assets);
    if (this.mark.options.favicon) this.assets.push(this.mark.options.favicon);

    if (this.assets.length > 0) this.mark.group(colors.green('Copying:'), 'assets');
    for(const asset of this.assets) 
    {
      // don't copy URLs
      if (URL.canParse(asset)) continue;

      const file = path.resolve(this.mark.inputDir, asset);
      if (fs.existsSync(file))
      {
        const stat = fs.statSync(file);
        const out = path.join(this.mark.output, stat.isFile() ? path.dirname(asset) : asset);

        // include directory structure with files
        this.mark.log('Copy:', file);
        fs.ensureDirSync(out);
        fs.copySync(file, out);
      }
      else this.mark.warning(`Given asset does not exist [${colors.red(file)}]`);
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
    // handle single file
    if (this.mark.isInputSolo)
    {
      const input = this.mark.isInputFile ? this.mark.options.input : this.mark.options.outputName + '.md';
      const entry = this.entry(this.mark.inputDir, path.basename(input), true);
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
      catch(e:any) { this.mark.warning(`${e.message} [${mfile}]`); }
      if (!Array.isArray(mark))
      {
        this.mark.warning(`Configuration must be an array [${colors.red(mfile)}]`);
        mark = [];
      }
    }
    // populate the children from the config
    for(const child of mark)
    {
      const entry = this.entry(dir, child.name);
      if (!entry) this.mark.warning(`Configuration [${colors.red(child.name)}] does not exist [${colors.red(mfile)}]`);
      else this.addChild(parent, entry, child);
    }

    // now get the rest of the files
    const subs:fs.Dirent[] = [];
    const files = fs.readdirSync(dir, {withFileTypes: true});
    for(const file of files)
    {
      const full = path.join(dir, file.name);
      if (this.mark.isExcluded(full)) continue;

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
    const parentDir = path.relative(this.mark.inputDir, path.dirname(md.path));
    // only add if it is not there
    if (!(md.entry in parent.children))
    {
      const title = this.mark.options.inheritTitle ? this.sitemap.title : this.title(md.path);
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
        const html = this.mark.isInputSolo ? this.mark.options.outputName : parts.name;
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
      this.mark.options.extensions.includes(file.slice(dot + 1));
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
    const entry = path.relative(this.mark.inputDir, test).replace(/\\/g, '/');

    // just populate if already checked
    if (precheck) return { entry: entry, path: test, md: test };

    // don't even bother if excluded
    if (this.mark.isExcluded(test)) return undefined;

    const isDirectory = fs.existsSync(test) && fs.lstatSync(test).isDirectory();
    // check all extensions first
    for (const ext of this.mark.options.extensions)
    {
      const file = `${test}.${ext}`;
      if (fs.existsSync(file)) 
      {
        const entry = path.relative(this.mark.inputDir, file).replace(/\\/g, '/');
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
          this.mark.warning(`Given css file cannot be read [${colors.red(file)}]`); 
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
        catch(e) { this.mark.warning(`Given js file cannot be read [${colors.red(file)}]`); }
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
      fs.ensureDirSync(dir);
      depth = '../' + depth;
    }

    if (!page.input) return undefined;
    const file = path.join(this.mark.output, page.href);
    const md = this.mark.isInputString ? file : page.input;
    const text = this.mark.isInputString ? this.mark.input : fs.readFileSync(md, {encoding: 'utf8'});
    this.mark.group(colors.green('Generating:'), file);

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
    fs.writeFileSync(file, html);
    this.generated.push(file);
    this.mark.groupEnd();

    // return the file path or html
    return this.mark.options.outputFormat === 'file' ? file : html;
  }

  /**
   * Creates the pdf version of the file
   * @param file the path to the html file or the html string
   */
  private async writePdf(file:string)
  {
    if (!this.mark.options.pdf || !this.puppeteer) return;
      
    const pdf = file.replace(/\.html$/, '.pdf');
    this.mark.log('Generating PDF:', pdf);
    
    await this.puppeteer.page.goto(
      url.pathToFileURL(file).toString(), 
      { waitUntil: 'networkidle2' }
    );

    // replace all markdown relative links with the pdf equivalent
    await this.puppeteer.page.evaluate(() =>
    {
      const links = document.querySelectorAll('.markugen-md-link');
      for(const link of links)
      {
        // @ts-expect-error puppeteer types no work here
        const matches = link.href.matchAll(/\.html/ig);
        // get the last match
        let match = undefined; for (const m of matches) match = m;
        if (match)
        {
          const lastIndex = match.index;
          const length = match[0].length;
          // @ts-expect-error puppeteer types no work here
          link.href = `${link.href.slice(0, lastIndex)}.pdf${link.href.slice(lastIndex + length)}`;
        }
      }
    });

    // get the content box
    const content = await this.puppeteer.page.$('#markugen-content');
    const box = await content?.boxModel();
    content?.dispose();

    await this.puppeteer.page.pdf({ 
      format: 'A4',
      path: pdf, 
      margin: {
        left: box?.content[0].x ?? '25px',
        right: box?.content[3].x ?? '25px',
        bottom: box?.content[0].y ?? '25px',
        top: box?.content[0].y ?? '25px',
      },
    });
  }

  /**
   * @returns the title for the given file or directory
   */
  private title(file:string)
  {
    return path.parse(file).name.replace(/[-_.]/g, ' ');
  }
}