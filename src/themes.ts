/**
 * Theme options
 */
export interface Theme {
  color?:string,
  colorSecondary?:string,
  bgColor?:string,
  bgColorSecondary?:string,
  borderColor?:string,
  borderColorSecondary?:string,
  accentColor?:string,
  fontFamily?:string,
  fontFamilyHeaders?:string,
}

/**
 * Light and dark themes
 */
export interface Themes {
  light?:Theme,
  dark?:Theme,
}
