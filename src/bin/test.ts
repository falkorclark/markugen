
import Markugen from '../markugen';

async function main()
{
  const mark = new Markugen({
    input: 'devops/tests',
    output: 'tests',
    clearOutput: true,
    includeHidden: true,
  });
  await mark.generate();
}

main();
