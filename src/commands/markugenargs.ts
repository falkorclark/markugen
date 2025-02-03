
import yargs from 'yargs';
import Markugen from '../markugen';

/**
 * Common arguments for all CLIs to support the options available to 
 * the {@link Markugen} object.
 */
export const MarkugenArgs:Record<string, yargs.Options> = {
  browser: {
    alias: ['b'],
    describe: 'the path to the Chrome or Firefox executable. This is only required ' +
          'if generating PDFs and Markugen is unable to locate the executable.',
    type: 'string',
    default: Markugen.findChrome(),
  },
  sandbox: {
    describe: 'turns off the use of a sandbox for Chrome, this should only ' +
      'be necessary if running in a container and generating PDFs',
    type: 'boolean',
    default: true,
  },
  color: {
    alias: ['c'],
    describe: 'if true, console output will be colored',
    type: 'boolean',
    default: true
  },
  quiet: {
    alias: ['q'],
    describe: 'if given, no output will be displayed',
    type: 'boolean',
    default: false,
  },
  debug: {
    alias: ['d'],
    describe: 'turns on debugging',
    type: 'boolean',
    default: false,
  },
};