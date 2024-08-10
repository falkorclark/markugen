
import { RendererThis } from 'marked';
import type { DirectiveConfig, Directive } from 'marked-directive';
import { encode } from 'html-entities';

export const tabsDirective: DirectiveConfig = {
  level: 'container',
  marker: ':::',
  renderer: tabs,
};

interface Tab 
{
  name:string,
  label:string,
  content:string,
  active:boolean,
}

function tabs(this:RendererThis, token:Directive) 
{
  if (token.meta.name === 'tabs')
  {
    // nothing to render
    if (!token.tokens) return '';

    const tabs:Tab[] = [];

    let current:Tab|undefined = undefined;
    for (const child of token.tokens)
    {
      // start a new tab
      if (child.raw.startsWith('::tab'))
      {
        const ctoken = child as Directive;
        current = {
          name: `tab-${tabs.length + 1}`,
          label: ctoken.text,
          content: '',
          active: tabs.length === 0,
        };
        tabs.push(current);
      }
      // else append to the current tab's content
      else if (current) current.content += this.parser.parse([child]);
    }

    let html = '<div class="markugen-tabs-container">\n<div class="markugen-tabs-labels">\n';
    // add the labels
    for (const tab of tabs)
      html += `<div name="${tab.name}" class="markugen-tab-label${tab.active ? ' active' : ''}">${encode(tab.label)}</div>\n`;
    html += '</div>\n<div class="markugen-tabs">\n';
    // add the content
    for (const tab of tabs)
      html += `<div name="${tab.name}" class="markugen-tab${tab.active ? '' : ' markugen-hidden'}">\n${tab.content}</div>\n`;
    return `${html}</div>\n</div>\n`;
  }
  return false;
}