# Components
The following sections show examples of compopnents that can be used within
the markdown files passed to Markugen.

## Admonitions/Callouts
Admonitions or Callouts follow GitHub flavored syntax. There are five (5) types
of callouts shown in the code below that results in the callouts that follow:

~~~md
> [!NOTE]
> This is a note.

> [!TIP]
> This is a tip.

> [!IMPORTANT]
> This is important.

> [!CAUTION]
> This is a caution alert!

> [!WARNING]
> This is a warning alert!
~~~

> [!NOTE]
> This is a note.

> [!TIP]
> This is a tip.

> [!IMPORTANT]
> This is important.

> [!CAUTION]
> This is a caution alert!

> [!WARNING]
> This is a warning alert!

## Tables
Tables use the basic markdown syntax with alignment support. The following
markdown will result in the table that follows:

~~~md
| Left Column     | Right Column    | Centered Column |
|:----------------|----------------:|-----------------|
| Foo             | Bar             | Centered        |
| Foo             | Bar             | Centered        |
| Foo             | Bar             | Centered        |
| Foo             | Bar             | Centered        |
~~~

| Left Column     | Right Column    | Centered Column |
|:----------------|----------------:|-----------------|
| Foo             | Bar             | Centered        |
| Foo             | Bar             | Centered        |
| Foo             | Bar             | Centered        |
| Foo             | Bar             | Centered        |

## Tabs
Tabs are reactive and are custom to Markugen. The following markdown syntax
will rsult in the tabs that follow:

~~~md
:::tabs

::tab[Tab 1]
This tab has some text on different lines.
Like this line and the previous.

::tab[Tab 2]
This tab has only one line.

::tab[Tab 3]
This tab has some formatting in it.
*Italicize this line please.*
**Bold this line please.**
~~Strike through this line please.~~

:::
~~~

:::tabs

::tab[Tab 1]
This tab has some text on different lines.
Like this line and the previous.

::tab[Tab 2]
This tab has only one line.

::tab[Tab 3]
This tab has some formatting in it.
*Italicize this line please.*
**Bold this line please.**
~~Strike through this line please.~~

:::

## Code Blocks
The following is an inline code block: `foo('hello world')`

This is a code block with hard coded text:

~~~js
// This is a code block test
function foo()
{
  const bar = 'Hello World!';
  console.log(bar);
}
~~~

### Commands
Commands are options that Markugen allows you to execute within code blocks
in your markdown file. Depending on the command, Markugen will populate the code
block with data from executing that command.

#### markugen.import
The `markugen.import` command will import a text file into the code block. The
following is an example of the `index.md` markdown file used to generate 
[the home page of this documentation](../index.md).

~~~md
markugen.import ../index.md
~~~

#### markugen.exec
The `markugen.exec` command will execute a shell command and populate the code
block with the output from the execution. The following example executes the
`echo` command with a string:

~~~
markugen.exec echo Hello World!
~~~
