
import Markugen from '../markugen';

function main()
{
  const mark = new Markugen({
    input: 'devops/tests',
    output: 'tests',
    clearOutput: true,
    includeHidden: true,
  });
  mark.generate();
}

main();
