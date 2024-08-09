# Options

Markugen comes with a set of options that can be provided when constructing
a new instance of Markugen. The following output shows all the available
options:

```ts
markugen.import ../../src/options.ts
```

## Themes

The theme options give the developer the opportunity to provide a set of
colors and fonts for `light` and `dark` mode. Any values that are not provided
will be set to the default Markugen colors and fonts. The values for each of
the theme options are strings and should be valid CSS values for colors or
fonts.

> [!TIP]
> If you would like to override styles other than the theme, please refer to
> the section on [styles](./Styles.md).

The following output shows the available theme colors and fonts that can be
supplied as options to Markugen:

```ts
markugen.import ../../src/themes.ts
```

The default colors used when no theme options are provided can be seen on this
website. Additionally, you are welcome to view the generated CSS file 
[here](../markugen.css).

