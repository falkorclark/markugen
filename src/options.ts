import { Theme, Themes } from './themes';
export { Theme, Themes } from './themes';
import Markugen from './markugen';

/**
 * Markugen configuration options
 */
export interface Options 
{
  /**
   * The format of the {@link input}. If string is used for
   * the format, then the input is assumed to be a markdown string, else it
   * is assumed to be a file or directory. The string format option implies
   * {@link embed} and {@link inheritTitle}. [default: file]
   */
  format?:'file'|'string',
  /**
   * The format of the {@link output}. If the format is `file` then 
   * {@link Markugen} will generate a file or set of
   * files in the given {@link output} directory. If the format is `string`,
   * then {@link Markugen} will return a string of html (the string output
   * format is only valid if the {@link format} is also `string` or
   * {@link input} is a file).
   * [default: 'file']
   */
  outputFormat?:'file'|'string',
  /**
   * Location of the input directory to look for markdown files or a path to
   * a single markdown file.
   */
  input:string,
  /**
   * Set of extensions (no dot) to look for in the provided input directory. 
   * By default, Markugen will only look for files ending in `md`.
   */
  extensions?:string[],
  /**
   * Directory to output the html files [default: './output']
   */
  output?:string,
  /**
   * The base name of the file to output. This option is only valid if {@link input}
   * is a string or a single file. The default is 'index' or the name of
   * the file if given a file as {@link input}.
   */
  outputName?:string,
  /**
   * If true, PDF files will be generated instead of html files. This option
   * implies {@link outputFormat} is `file`.
   */
  pdf?:boolean,
  /**
   * The path to the Chrome or Firefox executable. This is only required if {@link pdf}
   * is true and Markugen is unable to locate the executable.
   */
  browser?:string,
  /**
   * List of files or folders to exclude when looking for markdown files in
   * the {@link input} directory. This can be a single path or an array of
   * paths to exclude. The paths should be relative to the {@link input}
   * directory.
   */
  exclude?:string[],
  /**
   * The title to use for the navbar [default: 'Markugen vX.X.X']
   */
  title?:string,
  /**
   * If true, all pages not custom configured will inherit 
   * the site {@link title}.
   */
  inheritTitle?:boolean,
  /**
   * Overrides the footer html. [default: 'Generated by Markugen']
   */
  footer?:string,
  /**
   * If true, a timestamp will be embedded in the markugen page
   */
  timestamp?:boolean,
  /**
   * Path to the home page of the site relative to the output directory.
   * The default will use the first ordered page at the root level.
   */
  home?:string,
  /**
   * Maximum header depth to output in the Table of Contents. Values less than
   * or equal to zero will hide the Table of Contents. [default: 3]
   */
  toc?:number,
  /**
   * If true, all code (css and js) will be embedded in each file. The default
   * implementation will use a single file at the top-level.
   */
  embed?:boolean,
  /**
   * Relative path to an icon file to use as the favicon. The path must
   * be relative to the {@link input} directory. The file will automatically
   * be included as an {@link assets asset}.
   */
  favicon?:string,
  /**
   * Path(s) to assets folders or files to copy to output directory.
   * Directories will be copied recursively.
   */
  assets?:string[],
  /**
   * This option is only used if the {@link pdf} option is given. By 
   * default, if generating PDFs, Markugen will remove the assets
   * from the output folder. However, you may tell Markugen to keep the assets
   * if they are needed by passing this flag.
   */
  keepAssets?:boolean,
  /**
   * Additional JavaScript to embed in the script tag at the end of the body
   */
  script?:string,
  /**
   * List of paths to js files to include. These files must be absolute
   * URLs or relative to the input directory.
   */
  js?:string[],
  /**
   * Additional CSS to embed in the style tag at the beginning of the document
   */
  style?:string,
  /**
   * List of paths to css files to include. These files must be absolute
   * URLs or relative to the input directory.
   */
  css?:string[],
  /**
   * Defines the light and dark theme to use on the website. See {@link Theme}
   * for more details.
   */
  theme?:Themes,
  /**
   * Predefined variables that can be used in template expansion
   */
  vars?:Record<string,any>,
  /**
   * If true, files and folders that begin with a dot (.) will be included.
   * By default, files and folders that begin with a dot (.) are ignored.
   */
  includeHidden?:boolean,
  /**
   * If true, the {@link output} directory will be cleared before generation
   */
  clearOutput?:boolean,
  /**
   * If true, console output will be colored, else it will not
   */
  color?:boolean,
  /**
   * If true, markugen will silence its output.
   */
  quiet?:boolean,
  /**
   * Used internally to show full call stacks when an uncaught exception occurs.
   */
  debug?:boolean,
}