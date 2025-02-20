
{{
  let out = '';
  for (const [key, value] of Object.entries(vars.links))
    out += `markugen.markSitemap.addEntry('${key}', '${value}');\n`;
  return out;
}}
