# Markugen
Markugen was designed to make it easier for developers and non-developers to
create an entire website from a set of Markdown files. It is designed with 
brevity, clarity, and ease-of-use in mind. Additionally, the pages produced 
are static pages allowing for viewing without the need for a server.

The documentation you are viewing right now was generated using Markugen.

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
* Markdown to PDF
* Website generation
* Static HTML generation (no need for a server)
* Fully typed with [TypeScript](https://www.typescriptlang.org/)
* Reactive website sitemap and Table of Contents
* [Markdown Components](./Features/Components.md):
  * Admonitions/Callouts (GitHub flavored)
  * Tabs
  * Tables
  * Dynamic Code Blocks
* Dark and light themes

## Issues and Feature Requests
This NodeJS package was developed by Falkor Clark. Please contact Falkor at
[falkorclark@gmail.com](mailto:falkorclark@gmail.com) or submit an issue
on [GitHub](https://github.com) at 
[github.com/falkorclark/markugen](https://github.com/falkorclark/markugen/issues).