
import Markugen, { Options } from '../markugen';

async function main()
{
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
  mark = new Markugen(options);
  await mark.generate();
}

main();
