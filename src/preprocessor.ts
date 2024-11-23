
import Markugen from './markugen';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import colors from 'colors';

export default class Preprocessor
{
  /**
   * The regular expression used to find the templates
   */
  public readonly regex = /\{\{([^{].*?[^\\])\}\}/gs;
  /**
   * The regular expression used to filter the js code
   */
  public readonly filter = /(\\\}\})|(process\s*.\s*exit\s*\(.*?\))|(import\s*\(.*?\))/gs;
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
    this.vars = {...vars};
    this.vars['markugen'] = Markugen.toObject();
  }

  /**
   * Expands the given string by replacing template parameters
   * @param input the string to expand
   * @param file file being expanded if given one
   * @returns input expanded and template vars replaced
   */
  public process(input:string, file?:string):string
  {
    if (!input) return input;
    
    // copy the string so as to not modify the original
    let out:string = '';
    let match, lastIndex = 0;
    while ((match = this.regex.exec(input)) !== null)
    {
      const last = lastIndex;
      lastIndex = this.regex.lastIndex;
      // check for an escaped template expansion
      if (match.index && input[match.index-1] === '\\')
      {
        out += input.slice(last, match.index-1) + match[0];
        continue;
      }

      out += input.slice(last, match.index);
      // if the expression is empty
      const code = match[1];
      if (code.trim() === '') continue;

      const result = this.safeFunction(code, file);
      if (result != undefined) out += result.toString();
    }
    if (lastIndex < input.length) out += input.slice(lastIndex);
  
    return out;
  }

  /**
   * 
   * @param code the code to execute
   * @param file file being expanded if given one
   * @returns whatever is returned from the code call
   */
  private safeFunction(code:string, file?:string):any
  {
    const filtered = code.replace(this.filter, (match, p1) =>
    {
      if (p1) return '}}';
      return '';
    });
    const safe = `'use strict';\n${filtered}`;
    const utils = {
      fs: fs,
      path: path,
      os: os,
    };

    try
    {
      const func = Function('vars', 'utils', safe);
      const result = func(this.vars, utils);
      return result;
    }
    catch(e:any)
    {
      this.mark.warning(
        `Preprocesser failed when expanding ${colors.yellow(`{{${filtered}}}`)} ` +
        colors.red(`[${e.message}` + (file ? ` in ${file}]` : ']'))
      );
    }
  }
}