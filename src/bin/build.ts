import { spawnSync } from 'node:child_process';
import fs from 'fs-extra';
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
    input: 'markdown',
    output: 'docs',
    assets: ['examples'],
    exclude: ['examples'],
    clearOutput: true,
  });
  mark.generate();
}

/**
 * Compiles the project using the typescript compiler
 */
function tsc() 
{
  fs.removeSync('./lib');
  const result = spawnSync(
    'npx', ['tsc', '-p', 'tsconfig.json'],
    {shell:true, encoding:'utf8'}
  );
  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  return !result.error;
}

main();
