# Change Log v1
This page will be updated with changes to Markugen upon each new release.
The log was started at version 1.1.0 and will be continued for each new release
moving forward.

## v1.2.0

* no default assets
* no pdf only
* errors are thrown
* fix for newlines in cli input
* output format
* output name
* assets not automatic

## v1.1.2
This is a very small release that exports some extra utility functions and
adds the `Markugen.findChrome` function as a callable function for use by
modules using Markugen.

## v1.1.1
This is a minor version for fixing issues with PDF generation. 

* This version allows for `Markugen.generate` to be asynchronous or 
  synchronous. The method behaves synchronously if the `--pdf` option is not 
  given. However, if the `--pdf` option is given, the method will be 
  asynchronous and return a `Promise`. Additionally, you can call 
  `Markugen.generateSync` and the method will always be synchronous, but 
  the `--pdf` option will be ignored.
* Modified the required modules to use [Puppeteer Core](https://pptr.dev/)
  instead of `Puppeteer`. This reduces the size of Markugen, but also
  requires an installation of [Chrome](https://www.google.com/chrome/) to
  be installed on the machine if the `--pdf` option is given. The path to
  Chrome is usually detected, but, if not found, the path to your Chrome
  executable must be given with the `--chrome` option.

## v1.1.0
This version is mostly a fix for print views and adding PDF generation. The 
reason for the minor increment is due to generation being asynchronous now.

### Async Generation
`Markugen.generate` is now asynchronous and should be awaited:

##### Pre v1.1.0
```ts
// setup markugen and tell it where to find your files
const mark = new Markugen({
  input: 'markdown',
});
// generate the website
mark.generate();
```

##### Post v1.1.0
```ts
// setup markugen and tell it where to find your files
const mark = new Markugen({
  input: 'markdown',
});
// generate the website
await mark.generate();
```

### PDF Generation
This release now has two new options: `--pdf` and `--pdf-only`. These new 
options will generate PDF versions of each markdown page given as input. The
resulting PDF documents will be linked to each other as well. The `--pdf-only`
option will only generate the PDF files and no HTML files.

### Print View
When printing a page from the resulting HTML output, there are a few components
that do not react to printing very well.

1. [Code blocks](./Features/Components.md#code-blocks) that present with a 
   scroll bar in the browser due to overflow will be extended in the print view
   to ensure all code is displayed.
2. [Tabs](./Features/Components.md#tabs) will be broken into separate views
   when printing to ensure all tabs are visible.
3. The table of contents will be moved to the top of the page in print view to
   provide relative page linking and contents when printing.

