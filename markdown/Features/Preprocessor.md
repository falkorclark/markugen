# Preprocessor
Markugen provides a mechanism for executing JavaScript within your markdown
files before they are parsed and converted to HTML. The mechanism is known as
the Markugen preprocessor. The preprocessor executes before the markdown parser
allowing for dynamically generated content.

## Template Expansion
The preprocessor works by replacing/expanding JavaScript code that is surrounded
by double curly braces `\{{ code }}` and replacing the template with the return
value of the JavaScript within the braces. For example, the following
template code will be replaced with the words `Hello World!`:

~~~js
\{{ return 'Hello World!'; }}
~~~

Output from the above template:

~~~
{{ return 'Hello World!'; }}
~~~

> [!CAUTION]
> The preprocessor will execute any code within the curly braces; therefore, it
> is very important that you trust the markdown file being parsed.

## Escaping Literal Braces
Since Markugen's preprocessor interprets double curly braces as templates to
be expanded, you will need to escape sets of double curly braces if you want
the preprocessor to use literal braces. To escape the braces, just prepend the
open brace with a backslash (`\`) like so: `\\{{ code }}`

## Custom Variables
The preprocessor is also capable of providing the templated code blocks with
custom variables defined at the time the Markugen object is created. Referring
back to the [Options](./Options.md) page, you will see an option called `vars`.
The `vars` option is provided to allow you to define custom variables that
can be used within your templated code blocks.

For example, if the following code is provided to Markugen on creation, then
the string `You've been Marked!` will be available in all your templated code
blocks via the `vars` object provided to the executed code and the property
named `marked` like so: `vars['marked']`

~~~js
const mark = new Markugen({
  ...
  vars: {
    marked: "You've been Marked!"
  },
  ...
});
mark.generate();
~~~

The following templated code block is an example of using the `vars['marked']`
variable within the code block:

~~~js
\{{ return vars['marked']; }}
~~~

The above templated code block will output the following:

~~~
You've been marked!
~~~

### Markugen Variable
Markugen will define a custom variable within the `vars` object called 
`markugen` automatically. The `markugen` variable is an object with the 
following structure:

~~~js
markugen.import ../../src/markugendetails.ts
~~~

As an example, the following templated code block will output the values of
the `markugen` variable when this page was generated:

~~~js
\{{ return JSON.stringify(vars.markugen, null, 2); }}
~~~

Output from the above template:

~~~json
{{ return JSON.stringify(vars.markugen, null, 2); }}
~~~
