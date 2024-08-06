import { Theme, Themes } from './themes';
export { Theme, Themes } from './themes';

/**
 * Markugen configuration options
 */
export interface Options {
  /**
   * The format of the {@link input} and {@link output}. If string is used for
   * the format, then the input is assumed to be a markdown string, else it
   * is assumed to be a file or directory. The string format option implies
   * {@link embed} and {@link inheritTitle} and will cause the 
   * {@link Generator.generate} function to
   * return the HTML as a string instead of writing a file.
   */
  format?:'file'|'string',
  /**
   * Location of the input directory to look for markdown files or a path to
   * a single markdown file.
   */
  input:string,
  /**
   * Location to output the html files [default: './output']. If {@link format}
   * is 'string' this should contain the name of the file that will be written
   * by the caller. If not provided, 'index.html' will be used.
   */
  output?:string,
  /**
   * The title to use for the navbar [default: 'Markugen vX.X.X']
   */
  title?:string,
  /**
   * If true, all pages not custom configured will inherit the site {@link title}.
   */
  inheritTitle?:boolean,
  /**
   * Overrides the footer html. [default: 'Generated by Markugen']
   */
  footer?:string,
  /**
   * Path to the home page of the site relative to the output directory.
   * The default will use the first ordered page at the root level.
   */
  home?:string,
  /**
   * If true, allows for raw html to be used in markdown
   */
  allowHtml?:boolean,
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
   * Directories will be copied recursively. By default, markugen will look
   * for a folder in the {@link input} directory called 'assets'. If you do
   * not want the default behavior, you must pass an empty array or string,
   * not undefined.
   */
  assets?:string|string[],
  /**
   * Additional JavaScript to embed in the script tag at the end of the body
   */
  script?:string,
  /**
   * Path or list of paths to js files to include. These files must be absolute
   * URLs or relative to the input directory.
   */
  js?:string|string[],
  /**
   * Additional CSS to embed in the style tag at the beginning of the document
   */
  style?:string,
  /**
   * Path or list of paths to css files to include. These files must be absolute
   * URLs or relative to the input directory.
   */
  css?:string|string[],
  /**
   * Defines the light and dark theme to use on the website. See {@link Theme}
   * for more details.
   */
  theme?:Themes,
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
   * If true, markugen will silence its output.
   */
  quiet?:boolean,
  /**
   * Used internally to show full call stacks when an uncaught exception occurs.
   */
  debug?:boolean,
}