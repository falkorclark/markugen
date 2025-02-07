#!/usr/bin/env node

import Markugen, { MarkugenOptions } from '../markugen';
import colors from 'colors';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { MarkugenArgs } from '../commands/markugenargs';
import path from 'node:path';

interface Options extends MarkugenOptions
{
  browser: string,
  tests: string[],
  sandbox: boolean,
}

type TestFunc = (mark:Markugen, options:Options) => void|Promise<void>;

async function main()
{
  const tests:Record<string, TestFunc> = {
    html: html,
    embed: embed,
    pdf: pdf,
    docs: docs,
    string: string,
  };

  const args = yargs(hideBin(process.argv))
    .parserConfiguration({
      'duplicate-arguments-array': false,
      'strip-aliased': true,
      'strip-dashed': true,
    })
    .showHelpOnFail(false)
    .alias(['h'], 'help')
    .help('h')
    .options({
      ...MarkugenArgs,
      tests: {
        alias: ['t'],
        describe: 'list of tests to include',
        type: 'array',
        choices: Object.keys(tests),
        default: Object.keys(tests),
      },
    })
    .parse() as unknown as Options;

  try
  {
    const mark = new Markugen(args);
    for (const test of args.tests)
    {
      mark.group(colors.magenta('Testing:'), test);
      await tests[test](mark, args);
      mark.groupEnd();
    }
  }
  catch(e:any) 
  { 
    console.error(colors.red(e.stack));
    process.exit(1);
  }
}

const htmlOptions = {
  input: 'devops/tests',
  output: 'tests/html',
  clearOutput: true,
  includeHidden: true,
  assets: ['extra', 'assets'],
  extensions: ['md', 'txt'],
  favicon: 'extra/favicon.ico',
  css: ['extra/my.css'],
  js: ['extra/my.js'],
  vars: {
    links: {
      Google: 'https://www.google.com',
      Markugen: 'https://www.falkorclark.com/markugen',
    },
  },
};

/**
 * Tests HTML output
 * @param mark the {@link Markugen} instance
 * @param args the cli arguments
 */
function html(mark:Markugen, args:Options)
{
  mark.mdtohtml(htmlOptions);
}

/**
 * Tests HTML output with embed flag
 * @param mark the {@link Markugen} instance
 * @param args the cli arguments
 */
function embed(mark:Markugen, args:Options)
{
  mark.mdtohtml({
    ...htmlOptions,
    embed: true,
    output: 'tests/embed',
    assets: ['assets', path.resolve('markdown/examples')],
  });
}

/**
 * Tests docs output
 * @param mark the {@link Markugen} instance
 * @param args the cli arguments
 */
function docs(mark:Markugen, args:Options)
{
  mark.mdtohtml({
    input: 'markdown',
    output: 'tests/docs',
    clearOutput: true,
    includeHidden: true,
    assets: ['examples'],
  });
}

/**
 * Tests PDF output
 * @param mark the {@link Markugen} instance
 * @param args the cli arguments
 */
async function pdf(mark:Markugen, args:Options)
{
  // pdf output test
  await mark.generate({
    input: 'devops/tests',
    output: 'tests/pdf',
    clearOutput: true,
    includeHidden: true,
    assets: ['extra','assets'],
    extensions: ['md', 'txt'],
    favicon: 'extra/favicon.ico',
    pdf: true,
    pdfOnly: true,
    sandbox: args.sandbox,
    browser: args.browser,
    keepAssets: false,
  });
}


/**
 * Tests string input
 * @param mark the {@link Markugen} instance
 * @param args the cli arguments
 */
async function string(mark:Markugen, args:Options)
{
  const md = `  # Comparator Reports
| Path | Failure Rate | JSP Tools | Date | Expected | Actual |
|:-----|--------------|-----------|------|:---------|:-------|
| [simple\\bqm\\-attack\\comparator\\-results\\.html](simple/bqm-attack/comparator-results.md) | :span[6.305%]{style="color:rgb(89.26896551724138,187.38916256157637,112.43349753694582)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:26 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\simple\\bqm\\-attack\\.db](../devops/tests/batchrunner/simple/bqm-attack.db) | [simple\\bqm\\-attack\\batchrunner\\-output\\.db](simple/bqm-attack/batchrunner-output.db) |
| [simple\\bqm attack with spaces\\comparator\\-results\\.html](simple/bqm%20attack%20with%20spaces/comparator-results.md) | :span[6.305%]{style="color:rgb(89.26896551724138,187.38916256157637,112.43349753694582)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:26 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\simple\\bqm attack with spaces\\.db](../devops/tests/batchrunner/simple/bqm%20attack%20with%20spaces.db) | [simple\\bqm attack with spaces\\batchrunner\\-output\\.db](simple/bqm%20attack%20with%20spaces/batchrunner-output.db) |
| [distributions\\stepped\\comparator\\-results\\.html](distributions/stepped/comparator-results.md) | :span[0.000%]{style="color:rgb(80,200,120)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:27 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\distributions\\stepped\\bqm\\-attack\\.db](../devops/tests/batchrunner/distributions/stepped/bqm-attack.db) | [distributions\\stepped\\batchrunner\\-output\\.merged\\.db](distributions/stepped/batchrunner-output.merged.db) |
| [distributions\\json\\comparator\\-results\\.html](distributions/json/comparator-results.md) | :span[0.000%]{style="color:rgb(80,200,120)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:27 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\distributions\\json\\bqm\\-attack\\.db](../devops/tests/batchrunner/distributions/json/bqm-attack.db) | [distributions\\json\\batchrunner\\-output\\.merged\\.db](distributions/json/batchrunner-output.merged.db) |
| [distributions\\fixed\\comparator\\-results\\.html](distributions/fixed/comparator-results.md) | :span[0.000%]{style="color:rgb(80,200,120)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:31 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\distributions\\fixed\\bqm\\-attack\\.db](../devops/tests/batchrunner/distributions/fixed/bqm-attack.db) | [distributions\\fixed\\batchrunner\\-output\\.merged\\.db](distributions/fixed/batchrunner-output.merged.db) |
| [distributions\\csv\\comparator\\-results\\.html](distributions/csv/comparator-results.md) | :span[0.000%]{style="color:rgb(80,200,120)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:33 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\distributions\\csv\\bqm\\-attack\\.db](../devops/tests/batchrunner/distributions/csv/bqm-attack.db) | [distributions\\csv\\batchrunner\\-output\\.merged\\.db](distributions/csv/batchrunner-output.merged.db) |
| [distributions\\cep\\comparator\\-results\\.html](distributions/cep/comparator-results.md) | :span[0.000%]{style="color:rgb(80,200,120)"} | 1.0.5 | January 24, 2025 at 8\\:23\\:46 AM CST | [\\.\\.\\devops\\tests\\batchrunner\\distributions\\cep\\bqm\\-attack\\.db](../devops/tests/batchrunner/distributions/cep/bqm-attack.db) | [distributions\\cep\\batchrunner\\-output\\.merged\\.db](distributions/cep/batchrunner-output.merged.db) |
  `;
  mark.mdtohtml({
    input: md,
    output: 'tests/string',
    format: 'string',
    outputFormat: 'file',
  });
}

main();
