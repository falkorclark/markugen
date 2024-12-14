import { spawnSync } from 'node:child_process';
import Markugen from '../markugen';
import shell from 'shelljs';

async function main()
{
  tsc();
  await docs();
}

/**
 * Generates the documentation
 */
async function docs()
{
  const mark = new Markugen({
    input: 'markdown',
    output: 'docs',
    assets: 'examples',
    exclude: 'examples',
    clearOutput: true,
  });
  await mark.generate();
}

/**
 * Compiles the project using the typescript compiler
 */
function tsc() 
{
  shell.rm('-rf', './lib');
  const result = spawnSync(
    'npx', ['tsc', '-p', 'tsconfig.json'],
    {shell:true, encoding:'utf8'}
  );
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return !result.error;
}

main();
