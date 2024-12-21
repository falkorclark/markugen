# Change Log v1
This page will be updated with changes to Markugen upon each new release.
The log was started at version 1.1.0 and will be continued for each new release
moving forward.

## v1.2.0
This release fixes a number of issues that were found while working on PDF
generation.

### Error Handling
When errors are encountered during construction or generation, they are now
thrown. In previous releases, errors would be output to the console and
`process.exit()` was called which would crash your application. This change 
means you should wrap your Markugen calls in a `try/catch` block like so:

~~~js
try
{
  const mark = new Markugen({...});
  mark.generateSync();
}
catch(e)
{
  // handle the error here
}
~~~

### PDF Generation
PDF generation was not fully flushed out in previous releases; therefore, some
improvements were made to how PDF documents are generated.

* Removed the `--pdf-only` option; generation is either HTML or PDF, not both.
* During PDF generation, assets are copied over to ensure linked assets like
  images are embedded in the PDF properly; however, they are removed from the
  output once generation is complete. The `--keep-assets` option allows the
  user to tell Markugen to keep the assets in the output folder after 
  generation is complete.

### Output Options
Two new options were added for customizing the output that is generated:

* The `--output-format` option was added for determining the format of the
  output that is generated. Previously, if you provided `--format string` as
  your input, the output would be a string as well; however, the new
  option allows you to specify that the output should be a file with the
  `--output-format file` option. The `--output-format` option is only valid
  when the input format is also `string` and the `--pdf` option is `false`.
* The `--output-name` option was added to allow the user to specify the name
  of the file that is output when `--output-format file` is used. This option
  is only valid when `--input-format string` or the `--input` path is a
  single file and not a directory.

### Miscellaneous
* Removed [shelljs](https://www.npmjs.com/package/shelljs) package dependency 
  and replaced it with [fs-extra](https://www.npmjs.com/package/fs-extra)
* Added a new option `--extensions` that allows the user to supply a list of
  extensions to search for documents with. By default, Markugen will search
  for the `md` extension only.
* Previous releases would look for a folder called `assets` in the `--input`
  directory and assume they were assets by adding them to your `--assets` list
  automatically. This release no longer looks for the `assets` folder by
  default; therefore, you must provide the folder as an asset using the
  `--assets` option.
* Fixed a bug with newlines when using the `--format string` option with 
  the CLI. When passing a string as input that contained newlines, the newlines 
  were being escaped twice which resulted in output that did not have line
  breaks where the newlines occurred. This release fixes this behavior so 
  newlines are treated properly in string input.

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

