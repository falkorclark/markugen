# Examples
This page shows off some of the features/components available in Markugen.

## Admonitions/Callouts
Markugen provides a set of admonitions using GitHub-flavored syntax. There are
five (5) types of callouts shown below:

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

## Tabs
Tabs are reactive and are custom to Markugen. When creating tabs, the result 
will look like the following:

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
