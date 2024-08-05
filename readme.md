# Markugen

> Markdown to HTML static site generation tool

Welcome to Markugen! You have been Marked!! 😜

## Installation

```bash
npm install markugen
# or
yarn add markugen
# or
pnpm add markugen
```

## Usage

```ts
import Markugen from 'markugen';

const mark = new Markugen({
  input: 'devops/tests',
  output: 'docs',
  clearOutput: true,
});
mark.generate();
```

## Documentation

The full documentation can be found in the docs directory. The docs are gnerated
using Markugen; therefore, this is also a great place to see a demo of what 
Markugen produces as output.

## Related

* [marked](https://marked.js.org/) - Markdown parser used by Markugen
* [remark](https://github.com/remarkjs/remark) - ESM only markdown parser
* [rehype](https://github.com/rehypejs/rehype) - ESM only HTML generator

## Credit

Thanks to [Trevor Buckner](https://github.com/calculuschild) for mastering Marked!

Thanks to [Christopher Jeffrey](https://github.com/chjj) for starting Marked!

Much of this development and inspiration came from the [Unified](https://unifiedjs.com/)
collective and all of the plugins developed for [remark](https://github.com/remarkjs/remark)
and [rehype](https://github.com/rehypejs/rehype). These modules were used first,
but due to limitations with packagers like [pkg](https://www.npmjs.com/package/pkg)
and [nexe](https://www.npmjs.com/package/nexe) and not supporting ESM modules, I 
chose to switch to [marked](https://marked.js.org/) for the CommonJS support.