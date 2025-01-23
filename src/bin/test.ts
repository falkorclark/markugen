
import Markugen, { HtmlOptions } from '../markugen';
import colors from 'colors';

async function main()
{
  let chrome = undefined;
  if (process.argv.length > 2) chrome = process.argv[2];

  const options:HtmlOptions = {
    input: 'devops/tests',
    clearOutput: true,
    includeHidden: true,
    assets: ['assets'],
    extensions: ['md', 'txt'],
    browser: chrome,
  };

  try
  {
    const mark = new Markugen();

    // html output test
    options.output = 'tests/html';
    mark.mdtohtml(options);
  
    // pdf output test
    options.output = 'tests/pdf';
    options.pdf = true;
    await mark.generate(options);

    // doc output test
    options.input = 'markdown';
    options.output = 'tests/docs';
    options.assets = ['examples'];
    options.extensions = [];
    mark.mdtohtml(options);

    // string input test
    options.input = `# Comparator Reports
| Path | Failure Rate | JSP Tools | Date | Expected | Actual |
|:-----|--------------|-----------|------|:---------|:-------|
| [bqm\\-attack/comparator\\-results\\.html](bqm-attack/comparator-results.html) | :span[6.453%]{style="color:rgb(89.48620689655172,187.0935960591133,112.25615763546799)"} | 1.0.5 | January 23, 2025 at 9\\:41\\:21 AM CST | [\\.\\./devops/tests/batchrunner/simple/bqm\\-attack\\.db](../devops/tests/batchrunner/simple/bqm-attack.db) | [bqm\\-attack/batchrunner\\-output\\.db](bqm-attack/batchrunner-output.db) |
| [bqm attack with spaces/comparator\\-results\\.html](bqm%20attack%20with%20spaces/comparator-results.html) | :span[6.453%]{style="color:rgb(89.48620689655172,187.0935960591133,112.25615763546799)"} | 1.0.5 | January 23, 2025 at 9\\:41\\:21 AM CST | [\\.\\./devops/tests/batchrunner/simple/bqm attack with spaces\\.db](../devops/tests/batchrunner/simple/bqm%20attack%20with%20spaces.db) | [bqm attack with spaces/batchrunner\\-output\\.db](bqm%20attack%20with%20spaces/batchrunner-output.db) |
`;
    options.format = 'string';
    options.outputFormat = 'file';
    options.output = 'tests/string';
    options.assets = [];
    options.extensions = [];
    mark.mdtohtml(options);
  }
  catch(e:any) 
  { 
    console.error(colors.red(e.stack));
    process.exit(1);
  }
}

main();
