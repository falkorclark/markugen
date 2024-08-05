import { spawnSync } from 'node:child_process';
import Markugen from '../markugen';

function main()
{
  tsc();
  docs();
}

/**
 * Generates the documentation
 */
function docs()
{
  const mark = new Markugen({
    input: 'devops/tests',
    output: 'docs',
    clearOutput: true,
    // prevent the assets folder from being copied
    assets: [],
  });
  mark.generate();
}

/**
 * Compiles the project using the typescript compiler
 */
function tsc() 
{
  const result = spawnSync(
    'npm', ['run', 'tsc'],
    {shell:true, encoding:'utf8'}
  );
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return !result.error;
}

main();
