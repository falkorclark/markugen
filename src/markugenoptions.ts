
/**
 * Generator configuration options
 */
export interface MarkugenOptions 
{
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