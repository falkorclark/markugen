# Change Log v1
This page will be updated with changes to Markugen upon each new release.
The log was started at version 1.1.0 and will be continued for each new release
moving forward.

## v1.1.0
This version is mostly a fix for print views and adding PDF generation. The 
reason for the minor increment is due to generation being asynchronous now.

### Async Generation
`Markugen.generate` and `Generator.generate` are now asynchronous and should 
be awaited:

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

