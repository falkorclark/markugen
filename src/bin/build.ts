import { spawnSync } from 'node:child_process';
import Markugen from '../markugen';
import shell from 'shelljs';

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
    input: 'docs-md',
    output: 'docs',
    clearOutput: true,
  });
  mark.generate();
}

/**
 * Compiles the project using the typescript compiler
 */
function tsc() 
{
  shell.rm('-rf', './lib');
  const result = spawnSync(
    'npm', ['run', 'tsc'],
    {shell:true, encoding:'utf8'}
  );
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return !result.error;
}

main();
