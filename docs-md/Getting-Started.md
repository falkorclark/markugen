# Getting Started
This section of the documentation will walk you through a simple project
from start to finish. You will setup a website with four pages including
nested pages. 

The complete set of files you will generate during this example can be found 
in the [examples](https://github.com/falkorclark/markugen/tree/main/docs-md/examples) 
folder on GitHub or in your `node_modules/markugen/docs-md/examples` directory 
of your project that has Markugen installed.

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
the folders. 

### Home Page
The first file will be created in the `docs` directory. Download
the following file or copy and paste the markdown into a file named
`Home.md` and place the file in the `docs` directory.

```md
markugen.import examples/Home.md
```

### Subsection Page
When creating subfolders on your website, you will need to provide a markdown
file at the same level as the folder with the same name if you would like the
section to have a page. For this example, we will give the `subsection` folder
its own page by adding a markdown file named `subsection.md` that we will 
place in the `docs` folder. 

Download the following file or copy and paste the markdown into a file named
`subsection.md` and place the file in the `docs` directory.

```md
markugen.import examples/subsection.md
```

### Examples Page
The last page we will add is the examples page. This page will be a part of
the subsection we created; therefore, it will be placed in the `subsection`
folder.

Download the following file or copy and paste the markdown into a file named
`examples.md` and place the file in the `docs/subsection` directory.

```md
markugen.import examples/subsection/examples.md
```