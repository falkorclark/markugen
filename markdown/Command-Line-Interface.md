# Command Line Interface (CLI)
Markugen comes with a command line interface (CLI) that can be used in lieu
of having to build a Markugen object in code. Markugen will still need to be
installed into your project by using one of the following commands:

:::tabs
::tab[npm]
`npm install markugen`
::tab[yarn]
`yarn add markugen`
::tab[pnpm]
`pnpm add markugen`
:::

## Execution
Once Markugen has been installed, you should now be able to execute the CLI
via the following command:

```bash
npx markugen
```

Additionally, you can add markugen to your `package.json` as a script and
use `npm run` to execute the script:

```json
{
  ...
  "scripts": {
    "markugen": "markugen"
  }
}
```

## Options
Most of the [options](./Features/Options.md) available to Markugen's 
constructor are also available with the CLI. There are a few options that are 
too complex for the command line and, therefore, are not available 
(i.e. [themes](./Features/Options.md#themes)).

All available options/arguments can be viewed by executing one of the following
commands:

```bash
markugen help
# or
markugen -h
# or
markugen --help
```

The help option will output the following help message:

```
markugen.exec npm start -- help
```

## Subcommands
The CLI has two subcommands that can be used: `html` and `pdf`. The subcommands
have aliases as well: `mdtohtml` and `htmltopdf` respectively. The `html`
subcommand is the default command used by the CLI; therefore, if no command
is provided, it will use the `html` command. The options available for each 
subcommand can be obtained by providing the name of the command right before
the help option. The following two outputs show the options available via
the default `html` subcommand and the `pdf` subcommand respectively:

### Markdown to HTML
```
markugen.exec npm start -- html help
```

### HTML to PDF
```
markugen.exec npm start -- pdf help
```
