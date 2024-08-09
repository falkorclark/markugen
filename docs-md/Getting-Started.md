# Getting Started
To get started using Markugen in your project, you will need to first
install Markugen as a dependency. It is likely that you will be generating
your documentation as a build/publish step; therefore, you may want to add
`--save-dev` to the following commands to add it as a dev dependency.

## Install Markugen
To install Markugen within your NodeJS project, execute one of the following
commands:

```bash
npm install markugen
# or
yarn add markugen
# or
pnpm add markugen
```

## Build Your Documentation
This section assumes you already have a markdown file or a set of markdown 
files. To generate your documentation, it is quite simple, just create an
instance of the `Markugen` class and call `generate`. The following code
assumes your markdown files are in a directory called `markdown`. If your
markdown files are in a different folder, just change the `input` option to
point to the location of the folder containing your markdown files.

```ts
// setup markugen and tell it where to find your files
const mark = new Markugen({
  input: 'markdown',
});

// generate the documentation
mark.generate();
```

Markugen will output the HTML files to a folder in your current working 
directory or `cwd` called `output`. If you would like to change the output
location, provide Markugen with the output location via the `output` option
like so:

```ts
// setup markugen and tell it where to find your files
const mark = new Markugen({
  input: 'markdown',
  output: 'docs',
});

// generate the documentation
mark.generate();
```

That's all folks!

# Additional Options
Most of Markugen's options have default values associated with them. As a 
matter of fact, the only required option is the `input` option; all other
options have defaults. A few things to note about the defaults:

* The file name will be used as the title of each page
* The site title will be `Markugen vX.X.X` and should be overridden
* Page order is defaulted to alphabetical order

> [!TIP]
> Additional [options](./Features/Options.md) can be found in the 
> [Features Section](./Features.md) of this documentation.

> [!TIP]
> There is a full working example provided from start to finish that you can
> follow along with found [here](./Getting-Started/Example.md).
