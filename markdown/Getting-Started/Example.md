# Getting Started
This section of the documentation will walk you through a simple project
from start to finish. You will setup a website with three pages including
a nested page.

The complete set of files you will generate during this example can be found 
in the [examples](https://github.com/falkorclark/markugen/tree/main/markdown/examples) 
folder on GitHub or in your `node_modules/markugen/markdown/examples` directory 
of your project that has Markugen installed.

Additionally, all the files are provided with this documentation in the
[examples](../examples) folder.

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
markugen.import ../examples/Home.md
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
markugen.import ../examples/subsection.md
```

### Examples Page
The last page we will add is the examples page. This page will be a part of
the subsection we created; therefore, it will be placed in the `subsection`
folder.

Download the following file or copy and paste the markdown into a file named
`examples.md` and place the file in the `docs/subsection` directory.

```md
markugen.import ../examples/subsection/examples.md
```

## Generate Website
Now that we have a set of markdown files, we can generate our website from
the files. To generate the files, create an instance of Markugen and set the
`input` options to the location of yours `docs` folder that we created above
by adding the following code somewhere in your project:

```ts
// import markugen
import Markugen from 'markugen';

// setup the options
const mark = new Markugen({
  input: 'docs',
});

// generate the website
mark.generate();
```

> [!NOTE]
> Markugen will output some messages to let you know its progress. If you would
> like Markugen to be quiet, feel free to add `quiet: true` to the options and 
> Markugen will silence its output.

If all was successful, you should now have a set of HTML files located in a 
folder called `output` (this is the default folder for output). Feel free to
walk through the website that was generated to get a feel for what Markugen
produces as output.

## Customize Your Titles
You may have noticed that the page titles are identical to the name of the
markdown file used for each page; this is what Markugen does by default, but 
these titles can be customized without the need for a file rename. Additionally,
the website title is `Markugen vX.X.X` which is probably not what you want your
website to be titled; therefore, this title can also be customized.

### Custom Website Title
Let's first customize your website's title by adding an option to Markugen's
constructor called `title`. We will name the website `My Markugen Website` by
modifying your code to look like the following:

```ts
// import markugen
import Markugen from 'markugen';

// setup the options
const mark = new Markugen({
  input: 'docs',
  title: 'My Markugen Website', // customize the website title
});

// generate the website
mark.generate();
```

### Custom Page Title
The next step is to customize your page titles. For this step, we will need to
create a new file with the name `markugen.json` and place it in the directory
of the pages we want to customize. We are going to change the title of the 
`subsection.md` page; therefore, please download the following file or copy and
paste the text into a file called `markugen.json` and put it in the root `docs`
directory:

```json
markugen.import ../examples/markugen.json
```

> [!NOTE]
> This file is a [JSON](https://www.json.org) file that allows you to add some
> custom page settings. Each directory of your input will need its own
> `markugen.json` file if you wish to customize any pages within that directory.

The JSON file has a single JSON array in it that is an array of objects. The 
only required object property is the name, which must match the base name
(no extension) of the page you wish to customize. In this example, you will
see that we have provided a custom title for the `subsection` page called
`My Website Section`.

> [!TIP]
> The page order that is generated is based on alphabetical order of your
> markdown input files. If you would like to change the order of the pages, you
> can provide a custom order in your `markugen.json` file by simply ordering
> the pages in your array in the order you would like.

## Generate Website with Custom Titles
Now that we have customized our titles, we can go ahead and generate the website
again by executing the file that contains our `Markugen` instance.

# Summary
This example walked you through the generation of a website from a set of
3 markdown files and a subfolder to provide a section on your website. Some of
the features that you should be able to do now are:

* Generate a website from markdown files
* Customize the website's title
* Customize each page's title

There are many more features available to you, so please take a look at the
[Features Section](../Features.md) section for more advanced topics.