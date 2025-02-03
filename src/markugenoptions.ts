
/**
 * Markugen configuration options
 */
export interface MarkugenOptions 
{
  /**
   * The path to the Chrome or Firefox executable. This is only required if {@link pdf}
   * is true and Markugen is unable to locate the executable.
   */
  browser?:string,
  /**
   * Be very careful with this option as it turns off the use of a sandbox
   * when running chrome. This should only be necessary when running in a
   * container. [default: true]
   */
  sandbox?:boolean,
  /**
   * If true, console output will be colored, else it will not
   */
  color?:boolean,
  /**
   * If true, markugen will silence its output
   */
  quiet?:boolean,
  /**
   * Used internally to show full call stacks when an uncaught exception occurs
   */
  debug?:boolean,
  /**
   * Used internally to tell Markugen if it was executed from the cli or not
   */
  cli?:boolean,
}
