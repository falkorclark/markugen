
import Markugen from './markugen';
import colors from 'colors';

export default class Preprocessor
{
  /**
   * The regular expression used to find the templates
   */
  public static readonly regex = /\{\{(.*?)\}\}/g;
  /**
   * Instance of Markugen
   */
  public readonly mark:Markugen;
  /**
   * Variables to define before template expansion
   */
  public readonly vars:Record<string,any>;

  /**
   * Constructs a new preprocessor with the given variables
   * @param vars the variables to define before expansion
   */
  public constructor(mark:Markugen, vars:Record<string,any> = {})
  {
    this.mark = mark;
    this.vars = vars;
    this.vars['markugen'] = Markugen.toObject();
  }

  /**
   * Expands all templates `${{ code }}` and returns the new text
   * @param text the text to preprocess
   * @returns the text with all templates expanded
   */
  public process(text:string):string
  {
    // nothing to expand
    if(!text) return text;

    // copy the string so as to not modify the original
    let out:string = '';
    let match, lastIndex = 0;
    while ((match = Preprocessor.regex.exec(text)) !== null)
    {
      const last = lastIndex;
      lastIndex = Preprocessor.regex.lastIndex;
      // check for an escaped template expansion
      if (match.index && text[match.index-1] === '\\')
      {
        out += text.slice(last, match.index-1) + match[0];
        continue;
      }

      out += text.slice(last, match.index);
      // if the expression is empty
      const code = match[1].trim();
      if (!code) continue;

      try
      {
        const result = Function('vars', code)(this.vars);
        if (result != undefined) out += result.toString();
      }
      catch(e:any)
      {
        this.mark.log({
          label: `${e.name}:`,
          error: { exit: false },
        }, e.message, colors.yellow(match[0]));
      }
    }
    if (lastIndex < text.length) out += text.slice(lastIndex);

    // return the expanded text
    return out;
  }
}