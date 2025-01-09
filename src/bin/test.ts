
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
    mark.generateSync(options);
  
    // pdf output test
    options.output = 'tests/pdf';
    options.pdf = true;
    await mark.generate(options);

    // doc output test
    options.input = 'markdown';
    options.output = 'tests/docs';
    options.assets = ['examples'];
    options.extensions = [];
    mark.generateSync(options);
  }
  catch(e:any) 
  { 
    console.error(colors.red(e.stack));
    process.exit(1);
  }
}

main();
