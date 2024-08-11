/**
 * Theme options
 */
export interface Theme 
{
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
export interface Themes 
{
  light?:Theme,
  dark?:Theme,
}

/**
 * The default light and dark themes used by Markugen
 */
export const defaultThemes:Themes = {
  light: {
    color: 'black',
    colorSecondary: 'black',
    bgColor: 'white',
    bgColorSecondary: '#e5e4e2',
    borderColor: '#c0c0c0',
    borderColorSecondary: 'black',
    accentColor: '#1f6feb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", STHeiti, "Microsoft YaHei", SimSun, sans-serif',
    fontFamilyHeaders: 'Georgia Pro, Crimson, Georgia, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", STHeiti, "Microsoft YaHei", SimSun, sans-serif',
  },
  dark: {
    color: 'white',
    colorSecondary: 'silver',
    bgColor: '#423f3e',
    bgColorSecondary: '#2b2b2b',
    borderColor: '#404040',
    borderColorSecondary: 'silver',
    accentColor: '#a371f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", STHeiti, "Microsoft YaHei", SimSun, sans-serif',
    fontFamilyHeaders: 'Georgia Pro, Crimson, Georgia, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", STHeiti, "Microsoft YaHei", SimSun, sans-serif',
  }
};