import path from 'node:path';
import fs from 'fs-extra';
import { PdfOptions } from './pdfoptions';
import Markugen, { MarkugenOptions } from './markugen';
import puppeteer from 'puppeteer-core';
import url from 'url';
import Generator from './generator';
import * as Utils from './utils';

export * from './pdfoptions';

/**
 * Generator for HTML to PDF file generation
 */
export default class PdfGenerator extends Generator
{
  /**
   * The options to use in generate
   */
  public readonly options:Required<PdfOptions>;
  /**
   * The list of files to convert
   */
  private readonly files:string[] = [];

  /**
   * Constructs a new generator
   * @param mark the instance of {@link Markugen}
   */
  public constructor(mark:Markugen, options:PdfOptions & MarkugenOptions) 
  { 
    super(mark, options); 
    this.options = {
      input: options.input,
      browser: options.browser ?? Markugen.findChrome() ?? '',
      remove: options.remove ?? false,
      extensions: options.extensions ?? ['html'],
      links: options.links ?? true,
      noSandbox: options.noSandbox ?? false,
    };
  }

  /**
   * Generates the PDFs for the given {@link PdfOptions options}
   * @param options the {@link PdfOptions options} to use for generation
   * @returns a list of PDF files that were generated
   */
  public async generate():Promise<string[]>
  {
    this.validate();
    this.start();
    // prepare the browser
    this.log('Browser:', this.options.browser);

    const generated:string[] = [];
    const promises:Promise<string>[] = [];
    // loop over and write the pdf for each file
    for (const file of this.files) promises.push(this.writePdf(file));
    // wait for all promises to be settled
    const results = await Promise.allSettled(promises);
    for (const result of results) 
    {
      if (result.status === 'fulfilled')
        generated.push(result.value);
      else if (result.status === 'rejected')
        throw new Error(result.reason);
    }

    this.finish();
    return generated;
  }

  /**
   * Creates the pdf version of the file
   * @param file the path to the html file or the html string
   */
  private async writePdf(file:string):Promise<string>
  {
    const parts = path.parse(file);
    const pdf = path.join(parts.dir, parts.name + '.pdf');
    this.log('Generating PDF:', pdf);

    console.dir(this.options);
    const browser = await puppeteer.launch({
      executablePath: this.options.browser,
      args: this.options.noSandbox === true ? ['--no-sandbox', '--disable-setuid-sandbox'] : undefined,
    });
    const page = await browser.newPage();
    
    await page.goto(
      url.pathToFileURL(file).toString(), 
      { waitUntil: 'networkidle2' }
    );

    // replace all markdown relative links with the pdf equivalent
    if (this.options.links) await page.evaluate(() =>
    {
      const links = document.querySelectorAll('.markugen-md-link');
      for(const link of links)
      {
        //path.basename('foo/bar.txt');
        // @ts-expect-error puppeteer types no work here
        const html = link.href.split('#')[0].split('/').pop();
        const pdf = html.replace(/\.html$/ig, '.pdf');
        // @ts-expect-error puppeteer types no work here
        link.href = link.href.replace(html, pdf);
        link.innerHTML = link.innerHTML.replace(html, pdf);
      }
    });

    // get the content box
    const content = await page.$('#markugen-content');
    const box = await content?.boxModel();
    content?.dispose();

    await page.pdf({ 
      format: 'A4',
      path: pdf, 
      margin: {
        left: box?.content[0].x ?? '25px',
        right: box?.content[3].x ?? '25px',
        bottom: box?.content[0].y ?? '25px',
        top: box?.content[0].y ?? '25px',
      },
    });

    // close the browser
    await browser.close();

    // remove the html file if remove option given
    if (this.options.remove) fs.removeSync(file);

    // return the path to the pdf
    return pdf;
  }

  /**
   * Validates the given options
   * @param options the {@link PdfOptions options} to validate
   * @returns an array of files to generate PDFs for
   */
  private validate():void
  {
    // clear out the files
    this.files.length = 0;

    // always make it an array
    if (!Array.isArray(this.options.input)) this.options.input = [this.options.input];
    // resolve the paths
    for(let i = 0; i < this.options.input.length; i++)
    {
      this.options.input[i] = path.resolve(this.options.input[i]);
      if (!fs.existsSync(this.options.input[i]))
        throw new Error(`Input path does not exist [${this.options.input[i]}]`);
    }

    // check the browser
    if (!this.options.browser || !fs.existsSync(this.options.browser))
      throw new Error(`Unable to locate browser at [${this.options.browser}], cannot generate PDFs`);

    // handle the extensions
    if (this.options.extensions.length === 0) this.options.extensions.push('html');
    let pattern = '\\.';
    for (let i = 0; i < this.options.extensions.length; i++)
      pattern += `${i !== 0 ? '|' : ''}(${this.options.extensions[i]})`;
    pattern += '$';
    const regex = new RegExp(pattern, 'i');

    // collect the files
    for(const file of this.options.input)
    {
      const stat = fs.lstatSync(file);
      // directories need to be globbed
      if (stat.isDirectory()) this.collect(file, regex);
      // files are good to go
      else this.files.push(file);
    }

    // nothing to do if no files found
    if (this.files.length === 0) 
      throw new Error('No files found for PDF generation');
  }

  /**
   * Collects all html files found in the given directory
   * @param dir the directory to look in
   */
  private collect(dir:string, regex:RegExp)
  {
    const paths = fs.readdirSync(dir, {withFileTypes: true});
    for (const p of paths)
    {
      const full = path.join(p.parentPath, p.name);
      if (p.isFile() && regex.test(p.name)) this.files.push(full);
      else if (p.isDirectory()) this.collect(full, regex);
    }
  }
}