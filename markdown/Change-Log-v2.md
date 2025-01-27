# Change Log v2
This page will be updated with changes to Markugen upon each new release.
The log was started at version 2.0.0 and will be continued for each new release
moving forward.

## v2.0.2
This is another bug fix release. The following bugs were fixed in this release:

* Assets that were given as file paths and not directory paths were causing an
  error to be thrown due to the target being a directory. File paths now work
  just the same as directory paths.
* The text portion of a Markdown link was not being parsed as Markdown which
  resulted in the raw form of the text. The links now get parsed and
  interpreted properly.
* Markdown links who's text contains the link will have the extension replaced
  with the appropriate extension (html) in the text as well as the href.

## v2.0.1
This is a bug fix release. The primary bug fixed in this release deals with
Markdown that is given as a string for input instead of a file. Release
v2.0.0 outputs a file path in the HTML and causes some strange behavior in
the output. This release fixes the bug and produces normal output.

Additionally, a unit test was added that ensures this behavior is tested
in all future releases.

## v2.0.0
This is the first release of the Markugen 2.x series. 

### Markugen Class
The increment of the major version is due to some changes to the main 
function calls within the`Markugen` class. the following is a list of the 
major changes to the `Markugen` class:

* `Markugen.generateSync` no longer exists.
  * The asynchronous version `Markugen.generate` exists and should be used in
    most cases.
  * A synchronous version still exists for generating HTML from Markdown files,
    but this version ignores the use of the `--pdf` option and has been renamed
    to `Markugen.mdtohtml`.
  * PDF output can now be generated independent of the HTML generation by using
    the `Markugen.htmltopdf` method or the `markugen pdf` subcommand of the cli
* The `Markugen` constructor only takes options specific to `Markugen` and no
  longer accepts the `generate` options. Instead, the options for `generate`
  are provided with the call to `Markugen.generate`, `Markugen.mdtohtml`, and
  `Markugen.htmltopdf`.

### Relative Assets
Previous releases required all assets to be relative to the `--input` directory;
however, this release allows for `--assets` and `--favicon` to contain 
absolute paths and are **not** required to be relative to the `--input`
directory. Paths to assets may contain directories and/or files. Paths that
are provided as absolute paths will be copied to the root of the `--output`
directory.

### PDF Subcommand for CLI 
The Command Line Interface (CLI) has a new subcommand called `htmltopdf` or just
`pdf`. The subcommand allows for the `Markugen` CLI to be used for converting
HTML files to PDF files independent of the Markdown to HTML generation that is
the default and main use case for `Markugen`. More information can be found
in the 
[Command Line Interface Subcommands](./Command-Line-Interface.md#subcommands)
section of teh documentation.