
import Markugen, { Options } from '../markugen';

async function main()
{
  let chrome = undefined;
  if (process.argv.length > 1) chrome = process.argv[1];

  const options:Options = {
    input: 'devops/tests',
    output: 'tests/html',
    clearOutput: true,
    includeHidden: true,
    assets: ['assets'],
    extensions: ['md', 'txt'],
  };

  // html output test
  let mark = new Markugen(options);
  mark.generateSync();

  // pdf output test
  options.output = 'tests/pdf';
  options.pdf = true;
  options.browser = chrome;
  mark = new Markugen(options);
  await mark.generate();
}

main();
