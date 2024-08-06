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

## Inspiration

Before developing this package, I used many other packages to try and accomplish
developing a set of HTML documentation from markdown files. Some of the packages
I first used were the following:

* [Nextra](https://nextra.site/)
* [VuePress](https://vuepress.vuejs.org/)
* [Remark](https://github.com/remarkjs/remark) with [Rehype](https://github.com/rehypejs/rehype)

Nextra and VuePress both generate beautiful documentation, but depend on a server
to serve the resulting website. Remark and rehype were great options for 
generating static HTML pages from markdown files; however, they are ESM only 
modules and that causes problems with packagers like 
[pkg](https://www.npmjs.com/package/pkg)
and [nexe](https://www.npmjs.com/package/nexe). Therefore, I chose to begin
using [marked](https://marked.js.org/) for its CommonJS support and found this
and the many extensions to it to be the perfect starting point.

Marked does a great job of parsing markdown into HTML, but it is designed to
handle a single markdown string as input. Therefore, I have developed this
package to generate an entire website with navigation from a set of markdown
files. The resulting website does not require a server to host the pages and 
Markugen gives you the option to embed all required scripts and styles into
each page that is generated to allow each page to be viewed independently. Some
of the major features are listed below:

## Major Features

* Markdown to HTML
* Website generation
* Static HTML generation (no need for a server)
* Reactive website sitemap and Table of Contents
* Markdown components:
  * Tabs
  * Admonitions/Callouts (GitHub flavored)
* Dark and light themes

## Documentation and Demo

The full documentation can be found in the `docs` directory. The docs are generated
using Markugen; therefore, this is also a great place to see a demo of what 
Markugen produces as output. You can download the docs directory and view the
HTML files within it, or you can view the docs directly at the following
website: [falkorclark.com/markugen](https://www.falkorclark.com/markugen/index.html).

## Usage

The following code will generate the docs located in the Markugen package under
`docs-md` to a folder called `demo` and clear the `demo` directory before
generation:

```ts
import Markugen from 'markugen';

const mark = new Markugen({
  input: 'docs-md',
  output: 'demo',
  clearOutput: true,
});
mark.generate();
```

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