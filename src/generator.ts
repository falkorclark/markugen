import { GeneratorOptions } from './generatoroptions';
import Markugen from './markugen';
import colors from 'colors';

export * from './generatoroptions';

export interface OutputLabel 
{
  label: string,
  color?: colors.Color,
  ignoreQuiet?: boolean,
}

/**
 * Abstract base class for all generators
 */
export default abstract class Generator
{
  /**
   * Instance of Markugen
   */
  public readonly mark:Markugen;
  /**
   * Stores the common options to all generators
   */
  public readonly options:Required<GeneratorOptions>;

  /**
   * Constructs a new generator with the given Markugen instance and options
   * @param mark the instance of {@link Markugen}
   * @param options the common {@link GeneratorOptions}
   */
  public constructor(mark:Markugen, options?:GeneratorOptions) 
  { 
    this.mark = mark;
    this.options = {
      color: options?.color ?? true,
      quiet: options?.quiet ?? false,
    };
  }
  
  /**
   * Starts a console group
   */
  public group(...args:any[]) 
  { 
    if(!this.options.quiet) console.group(...args); 
  }
  /**
   * Ends a console group
   */
  public groupEnd() { if(!this.options.quiet) console.groupEnd(); }
  
  /**
   * Use in place of console.log so the app can handle coloring
   * and any cli options that were given
   */
  public log(label:OutputLabel|string, ...args:any[])
  {
    const ol = typeof label === 'string' ? {label: label} : label;
    if (!this.options.quiet && ol.ignoreQuiet !== true) 
    {
      const color = ol.color ? ol.color : colors.green;
      if (ol.label) console.log(color(ol.label), ...args);
      else console.log(...args);
    }
  }
  /**
   * Use in place of console.log so the app can handle coloring
   * and any cli options that were given
   */
  public warning(...args:any[])
  {
    this.log({ label: 'Warning:', color: colors.yellow }, ...args);
  }
  /**
   * Outputs the given error message
   * @param e the error to log
   */
  public error(e:Error) { this.mark.error(e); }
}