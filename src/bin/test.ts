
import Markugen, { Options } from '../markugen';
import colors from 'colors';

async function main()
{
  let chrome = undefined;
  if (process.argv.length > 2) chrome = process.argv[2];

  const options:Options = {
    input: 'devops/tests',
    output: 'tests/html',
    clearOutput: true,
    includeHidden: true,
    assets: ['assets'],
    extensions: ['md', 'txt'],
  };

  try
  {
    // html output test
    let mark = new Markugen(options);
    mark.generateSync();
  
    // pdf output test
    options.output = 'tests/pdf';
    options.pdf = true;
    options.browser = chrome;
    mark = new Markugen(options);
    await mark.generate();

    // doc output test
    options.input = 'markdown';
    options.output = 'tests/docs';
    options.assets = ['examples'];
    options.extensions = [];
    mark = new Markugen(options);
    mark.generateSync();
  }
  catch(e:any) 
  { 
    console.error(colors.red(e.stack));
    process.exit(1);
  }
}

main();
