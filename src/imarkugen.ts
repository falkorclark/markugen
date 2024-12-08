
/**
 * Defines the properties of the markugen variable used by the 
 * {@link Preprocessor} when expanding templates.
 */
export default interface IMarkugen
{
  /**
   * The version of Markugen used
   */
  version:string,
  /**
   * The name of Markugen
   */
  name:string,
  /**
   * The date/time stamp of Markugen creation
   */
  timestamp?:Date,
  /**
   * The platform on which Markugen was executed
   */
  platform:'windows'|'linux',
  /**
   * Markugen home page
   */
  homepage:string,
}