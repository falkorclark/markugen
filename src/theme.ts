/**
 * Theme options
 */
export default interface Theme 
{
  /**
   * Primary text color
   */
  color?:string,
  /**
   * Secondary text color used on backgrounds
   */
  colorSecondary?:string,
  /**
   * Primary background color
   */
  bgColor?:string,
  /**
   * Secondary background color
   */
  bgColorSecondary?:string,
  /**
   * Primary color for borders
   */
  borderColor?:string,
  /**
   * Secondary color for borders
   */
  borderColorSecondary?:string,
  /**
   * Accent color used on links and alike
   */
  accentColor?:string,
  /**
   * Font family used for the sites text
   */
  fontFamily?:string,
  /**
   * Font family used for the title/heading text
   */
  fontFamilyHeaders?:string,
  /**
   * Maximum height of code blocks
   */
  codeMaxHeight?:string,
}