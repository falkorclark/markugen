
import Markugen, { MarkugenOptions, OutputLabel, timeFormat } from './markugen';
import colors from 'colors';

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
   * The type of the generator
   */
  public readonly type:string;
  /**
   * The generate start time for recording elapsed time
   */
  protected startTime:[number,number]|undefined;
  /**
   * Used internally to prevent multiple async calls to {@link generate}
   */
  protected isActive:boolean = false;

  /**
   * Constructs a new generator with the given Markugen instance and options
   * @param mark the instance of {@link Markugen}
   * @param options the common {@link MarkugenOptions}
   */
  public constructor(mark:Markugen, options?:MarkugenOptions) 
  { 
    this.mark = mark;
    if (options) this.mark.options = options;
    this.type = this.constructor.name.replace(/generator/i, '').toLowerCase();
  }

  /**
   * Generates the output with the initialized options
   */
  public abstract generate():string|string[]|undefined|Promise<string|string[]|undefined>;
  
  /**
   * Initializes generation
   */
  protected start()
  {
    if (this.isActive) throw new Error('Generator already active, cannot call generate while active');
    this.isActive = true;
    this.startTime = process.hrtime();
    // write the html files
    this.group(colors.green('Generating:'), this.type);
  }
  /**
   * Computes the elapsed time and finishes everything
   */
  protected finish()
  {
    const end = process.hrtime(this.startTime);
    const ms = end[0] * 1000 + end[1] / 1000000;
    const elapsed = timeFormat(ms, {fixed: 2});
    this.isActive = false;
    this.groupEnd();
    this.log('Generating Finished:', elapsed);
  }
  
  /**
   * Starts a console group
   */
  public group(...args:any[]) { this.mark.group(...args); }
  /**
   * Ends a console group
   */
  public groupEnd() { this.mark.groupEnd(); }
  
  /**
   * Use in place of console.log so the app can handle coloring
   * and any cli options that were given
   */
  public log(label:OutputLabel|string, ...args:any[])
  {
    this.mark.log(label, ...args);
  }
  /**
   * Use in place of console.log so the app can handle coloring
   * and any cli options that were given
   */
  public warning(...args:any[]) { this.mark.warning(...args); }
  /**
   * Outputs the given error message
   * @param e the error to log
   */
  public error(e:Error) { this.mark.error(e); }
}