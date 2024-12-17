# Styles

Markugen uses a complete set of CSS styles to make your generated HTML look
sleek and modern. All styles defined by Markugen (classes and IDs) are
prepended with `markugen-` to avoid conflicts with other styles. There are,
however, a few styles that do not follow this convention due to them being
generated and used by extensions not developed by Markugen. For example, all
styles defined for syntax highlighting of code blocks uses 
[highlight.js](https://highlightjs.org/) which prepends its styles with `hljs-`.

The following stylesheet shows all of the styles that will be provided to
your generated files:

```css
markugen.import ../../templates/markugen.template.css
```

> [!NOTE]
> The file is a template and has a couple of special template parameters in it:
> `\{{ ... }}`. These values will be replaced with the default
> colors or those provided to Markugen upon configuration.

## Custom Styles

All of the default styles can be overridden by providing `styles` or `css` to 
Markugen's options upon creation. The provided styles will always be placed 
after Markugen's styles to ensure you can override them.

The site's theme colors and fonts can be provided via Markugen's options
without the need for providing your own CSS stylesheet.
