
/**
 * Base configuration for a page
 */
export interface PageConfig 
{
  /**
   * the base name of the page
   */
  name:string,
  /**
   * full path to the input file for this page
   */
  input?:string,
  /**
   * the depth of the table of contents
   */
  toc?:number,
  /**
   * the title of the page
   */
  title?:string,
  /**
   * whether or not the page is collapsible
   */
  collapsible?:boolean,
}

/**
 * Full page configuration
 */
export interface Page extends PageConfig 
{
  /**
   * the relative location of the page
   */
  href?:string, 
  /**
   * the children of the page if it has any
   */
  children?: Record<string, Page>,
}

/**
 * Special config for top-level sitemap
 */
export interface Sitemap extends Page 
{
  /**
   * the home page of the site
   */
  home:string,
  /**
   * the footer html for the site
   */
  footer:string,
}