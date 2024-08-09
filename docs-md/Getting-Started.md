# Getting Started
This section of the documentation will walk you through a simple project
from start to finish. You will setup a website with four pages including
nested pages. 

The complete set of files you will generate during this example can be found 
in the [examples](https://github.com/falkorclark/markugen/tree/main/examples) 
folder on GitHub or in your `node_modules/markugen` directory of your project
that has Markugen installed.

Additionally, all the files are provided with this documentation in the
[examples](./examples) folder.

## Install Markugen
The first step is to install Markugen within your NodeJS project by running
one of the following commands:

```bash
npm install markugen
# or
yarn add markugen
# or
pnpm add markugen
```

## Create Folder Structure
The next step will be to setup a folder structure for your documentation
where we will put the markdown files. Begin by creating the
following folder structure within your project:

* docs
  * subsection

## Create Markdown Files
Now that we have a folder structure, let's begin adding markdown files to
the folders. The first file will be created in the `docs` directory. Download
the following file or copy and paste the markdown into a file named
`Home.md` and place the file in the `docs` directory.

```md
markugen.import examples/Home.md
```
