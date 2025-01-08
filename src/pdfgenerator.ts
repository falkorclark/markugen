import path from 'node:path';
import fs from 'fs-extra';
import PdfOptions from './pdfoptions';
import Markugen from './markugen';
import puppeteer from 'puppeteer-core';
import url from 'url';
import colors from 'colors';
import { timeFormat } from './utils';

/**
 * Generator for HTML to PDF file generation
 */
export default class PdfGenerator
{
  /**
   * Instance of Markugen
   */   
  public readonly mark:Markugen;

  /**
   * Constructs a new generator
   * @param mark the instance of {@link Markugen}
   */
  public constructor(mark:Markugen) { this.mark = mark; }

  /**
   * Generates the PDFs for the given {@link PdfOptions options}
   * @param options the {@link PdfOptions options} to use for generation
   * @returns a list of PDF files that were generated
   */
  public async generate(options:PdfOptions):Promise<string[]>
  {
    // record the start time
    const start = process.hrtime();

    // validate before generation
    const opts:Required<PdfOptions> = {
      input: options.input,
      browser: options.browser ?? Markugen.findChrome() ?? '',
      remove: options.remove ?? false,
      extensions: options.extensions ?? ['html'],
    };
    const files = this.validate(opts);

    this.mark.group(colors.green('Generating:'), 'pdf');
    // prepare the browser
    this.mark.log('Browser:', opts.browser);

    const promises:Promise<string>[] = [];
    // loop over and write the pdf for each file
    for (const file of files) promises.push(this.writePdf(file, opts));
    // wait for all promises to be settled
    const results = await Promise.allSettled(promises);
    const generated:string[] = [];
    for (const result of results) 
      if (result.status === 'fulfilled')
        generated.push(result.value);

    const end = process.hrtime(start);
    const ms = end[0] * 1000 + end[1] / 1000000;
    const elapsed = timeFormat(ms, {fixed: 2});
    this.mark.groupEnd();
    this.mark.log('Generating Finished:', elapsed);
    return generated;
  }

  /**
   * Creates the pdf version of the file
   * @param file the path to the html file or the html string
   */
  private async writePdf(file:string, options:Required<PdfOptions>):Promise<string>
  {
    const parts = path.parse(file);
    const pdf = path.join(parts.dir, parts.name + '.pdf');
    this.mark.log('Generating PDF:', pdf);

    const browser = await puppeteer.launch({executablePath: options.browser});
    const page = await browser.newPage();
    
    await page.goto(
      url.pathToFileURL(file).toString(), 
      { waitUntil: 'networkidle2' }
    );

    // replace all markdown relative links with the pdf equivalent
    await page.evaluate(() =>
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
    if (options.remove) fs.removeSync(file);

    // return the path to the pdf
    return pdf;
  }

  /**
   * Validates the given options
   * @param options the {@link PdfOptions options} to validate
   * @returns an array of files to generate PDFs for
   */
  private validate(options:Required<PdfOptions>):string[]
  {
    const files:string[] = [];
    // always make it an array
    if (!Array.isArray(options.input)) options.input = [options.input];
    // resolve the paths
    for(let i = 0; i < options.input.length; i++)
    {
      options.input[i] = path.resolve(options.input[i]);
      if (!fs.existsSync(options.input[i]))
        throw new Error(`Input path does not exist [${options.input[i]}]`);
    }

    // check the browser
    if (!options.browser || !fs.existsSync(options.browser))
      throw new Error(`Unable to locate browser at [${options.browser}], cannot generate PDFs`);

    // handle the extensions
    if (options.extensions.length === 0) options.extensions.push('html');
    let pattern = '\\.';
    for (let i = 0; i < options.extensions.length; i++)
      pattern += `${i !== 0 ? '|' : ''}(${options.extensions[i]})`;
    pattern += '$';
    const regex = new RegExp(pattern, 'i');

    // collect the files
    for(const file of options.input)
    {
      const stat = fs.lstatSync(file);
      // directories need to be globbed
      if (stat.isDirectory()) this.collect(file, files, regex);
      // files are good to go
      else files.push(file);
    }

    // nothing to do if no files found
    if (files.length === 0) 
      throw new Error('No files found for PDF generation');

    return files;
  }

  /**
   * Collects all html files found in the given directory
   * @param dir the directory to look in
   */
  private collect(dir:string, files:string[], regex:RegExp)
  {
    const paths = fs.readdirSync(dir, {withFileTypes: true});
    for (const p of paths)
    {
      const full = path.join(p.parentPath, p.name);
      if (p.isFile() && regex.test(p.name)) files.push(full);
      else if (p.isDirectory()) this.collect(full, files, regex);
    }
  }
}