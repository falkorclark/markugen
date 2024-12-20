
class MarkugenMenu
{
  mark = null;
  hamburger = null;
  menu = null;
  content = null;
  hiddenByUser = false;
  hidden = false;
  entries = [];

  constructor(markugen, content)
  { 
    this.mark = markugen;
    this.content = content;
    window.addEventListener('click', (e) => this.onclick(e));
  }

  isAlwaysHidden() { return this.entries.length < 2; }
  hideAlways()
  {
    if (!this.content.classList.contains('markugen-hidden'))
      this.content.classList.add('markugen-hidden');
    if (!this.menu.classList.contains('markugen-hidden'))
      this.menu.classList.add('markugen-hidden');
    if (!this.hamburger.classList.contains('markugen-hidden'))
      this.hamburger.classList.add('markugen-hidden');
    this.hidden = true;
  }

  show(user = false)
  {
    if (!this.hidden)
    {
      if (user && this.hiddenByUser) this.hiddenByUser = false;
      return;
    }

    if (this.mark.isWidescreen() && (!user || !this.hiddenByUser))
    {
      this.content.classList.remove('markugen-hidden');
      this.menu.classList.remove('markugen-hidden');
    }
    else if (!this.mark.isWidescreen())
    {
      if (!this.content.classList.contains('markugen-hidden')) 
        this.content.classList.add('markugen-hidden');
      this.menu.classList.remove('markugen-hidden');
    }
    this.hidden = false;
    if (user) this.hiddenByUser = this.hidden;
  }
  hide(user = false)
  {
    if (this.hidden)
    {
      if (user && !this.hiddenByUser) this.hiddenByUser = true;
      return;
    }
    if (!this.content.classList.contains('markugen-hidden')) 
      this.content.classList.add('markugen-hidden');
    if (!this.menu.classList.contains('markugen-hidden')) 
      this.menu.classList.add('markugen-hidden');
    this.hidden = true;
    if (user) this.hiddenByUser = this.hidden;
  }
  toggle(user = false)
  {
    if (this.mark.isWidescreen())
      this.content.classList.toggle('markugen-hidden');
    else if (!this.content.classList.contains('markugen-hidden')) 
      this.content.classList.add('markugen-hidden');
    
    this.hidden = this.menu.classList.toggle('markugen-hidden');
    if (user) this.hiddenByUser = this.hidden;
  }
  
  onclickHamburger(e)
  {
    this.toggle(true); 
    e.stopPropagation();
  }
  onclick(e)
  {
    if (!this.mark.isWidescreen() && !this.hidden)
      this.hide();
  }
  onresize()
  {
    if (this.mark.isWidescreen() && !this.hiddenByUser)
    {
      this.content.classList.remove('markugen-hidden');
      this.menu.classList.remove('markugen-hidden');
    }
    else if (!this.mark.isWidescreen())
    {
      if (!this.content.classList.contains('markugen-hidden')) 
        this.content.classList.add('markugen-hidden');
      if (!this.menu.classList.contains('markugen-hidden')) 
        this.menu.classList.add('markugen-hidden');
    }
  }
}

class MarkugenSitemap extends MarkugenMenu
{
  constructor(markugen)
  {
    super(markugen, markugen.contentLeft);

    // create the hamburger menu
    this.hamburger = document.createElement('div');
    this.hamburger.id = 'markugen-navbar-menu';
    this.hamburger.innerHTML = '<svg width="30px" height="30px" viewBox="0 -960 960 960" fill="var(--markugen-color)"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>';
    this.hamburger.onclick = (e) => this.onclickHamburger(e);
    this.mark.navbarContents.insertBefore(this.hamburger, this.mark.title);

    // create the left menu
    this.menu = document.createElement('div');
    this.menu.id = 'markugen-sitemap-menu';
    this.menu.className = 'markugen-not-printable';
    this.mark.body.appendChild(this.menu);
    this.addChildren(this.mark.sitemap, this.menu);
  }

  // add link to the sitemap menu
  addEntry(title, href, active = false, parentElement = undefined, depth = 0)
  {
    // default to the root
    if (!parentElement) parentElement = this.menu;

    // create the entry element
    const entry = document.createElement('div');
    entry.className = 'markugen-sitemap-entry';
    entry.style.paddingLeft = `${depth * 20 + 10}px`;
    parentElement.appendChild(entry);
    // create the title element
    const ititle = document.createElement('div');
    ititle.className = 'markugen-sitemap-title';
    ititle.innerHTML = title;
    entry.appendChild(ititle);
    // handle active
    if (href)
    {
      entry.className = entry.className + (active ? ' active' : ' link');
      if (!active) entry.onclick = () => window.location.href = href;
    }
    // save and return the entry
    this.entries.push(entry);
    // show the sitemap if not shown
    this.show();
    // return the entry
    return entry;
  }

  addChildren(parent, parentElement, depth = 0)
  {
    // add the page links
    for(const child in parent.children)
    {
      const page = parent.children[child];
      const hasPage = /\.html$/i.test(page.href);
      const hasChildren = page.children && Object.keys(page.children).length > 0;
      if (!hasPage && !hasChildren) continue;

      // add the entry
      const item = this.addEntry(
        page.title, 
        page.href ? this.mark.pathToRoot + page.href : undefined, 
        page.active, 
        parentElement, 
        depth
      );

      // handle sections with children
      if (hasChildren)
      {
        // create the section
        const section = document.createElement('div');
        section.className = 'markugen-sitemap-section';
        parentElement.appendChild(section);

        // add the expander
        if (page.collapsible !== false)
        {
          const expander = document.createElement('div');
          expander.className = 'markugen-sitemap-expander';
          expander.innerHTML = this.mark.arrow('rotate(90deg)');
          if (!page.expanded && !this.isDescendant(page, this.mark.page))
          {
            expander.innerHTML = this.mark.arrow();
            section.classList.add('markugen-hidden');
          }
          expander.onclick = () => {
            if (section.classList.toggle('markugen-hidden'))
              expander.innerHTML = this.mark.arrow();
            else expander.innerHTML = this.mark.arrow('rotate(90deg)');
          }
          item.appendChild(expander);
        }
        
        // add the children
        this.addChildren(page, section, depth + 1);
      }
    }
  }

  // returns true if the given page is a child of the given parent
  isChild(parent, page)
  {
    if (!parent.children) return false;
    for (const key in parent.children) 
      if (page === parent.children[key]) 
        return true;
    return false;
  }
  // returns true if the given page is a descendant of the given parent
  isDescendant(parent, page)
  {
    if (parent === page) return true;
    if (!parent.children) return false;
    for (const key in parent.children)
    {
      if (page === parent.children[key]) return true;
      if (this.isDescendant(parent.children[key], page)) return true;
    }
    return false;
  }
}

class MarkugenToc extends MarkugenMenu
{
  headers = [];
  activeLink = null;
  printMenu = null;

  constructor(markugen)
  {
    super(markugen, markugen.contentRight);

    const hs = [];
    for(let i = 1; i <= this.mark.page.toc; i++) hs.push(`h${i}`);

    // create the hamburger menu
    this.hamburger = document.createElement('div');
    this.hamburger.id = 'markugen-navbar-toc';
    this.hamburger.innerHTML = '<svg width="30px" height="30px" viewBox="0 -960 960 960" fill="var(--markugen-color)"><path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z"/></svg>';
    this.hamburger.onclick = (e) => this.onclickHamburger(e);
    this.mark.toolbar.appendChild(this.hamburger);

    this.headers = hs.length === 0 ? [] : document.querySelectorAll(hs.join(','));

    this.menu = document.createElement('div');
    this.menu.id = 'markugen-toc';
    this.menu.className = 'markugen-not-printable';
    this.mark.body.appendChild(this.menu);
    // print version
    this.printMenu = document.createElement('div');
    this.printMenu.className = 'markugen-printable';

    const header = document.createElement('div');
    header.id = 'markugen-header';
    header.innerHTML = this.mark.page.title;
    this.printMenu.appendChild(header);

    const title = document.createElement('div');
    title.innerHTML = 'Contents';
    title.id = 'markugen-toc-title';
    this.menu.appendChild(title);
    // print version
    const ptitle = document.createElement('h1');
    ptitle.innerHTML = title.innerHTML;
    this.printMenu.appendChild(ptitle);

    const content = document.createElement('div');
    content.id = 'markugen-toc-content';
    this.menu.appendChild(content);
    // print version
    const pcontent = document.createElement('div');
    this.printMenu.appendChild(pcontent);

    // add the headers
    const toplevel = this.addLinks(this.headers);
    this.createLinks(toplevel.children, content, pcontent);

    const back = document.createElement('div');
    back.id = 'markugen-toc-back';
    back.innerHTML = '<a href="#">Back to Top</a>';
    this.menu.appendChild(back);

    // insert the print menu at the top of the content
    const children = [];
    for (const child of this.mark.content.children)
      children.push(child);
    this.mark.content.appendChild(this.printMenu);
    for (const child of children) this.mark.content.appendChild(child);

    if (!this.isAlwaysHidden())
      document.addEventListener('scroll', () => this.onscroll());
  }

  createLinks(children, parent, printParent, depth = 0)
  {
    const ul = document.createElement('ul');
    printParent.appendChild(ul);
    for(const child in children)
    {
      const header = children[child];
      const link = document.createElement('div');
      link.className = 'markugen-toc-link';
      link.style.paddingLeft = `${depth * 20 + 10}px`;
      link.setAttribute('name', header.id);
      link.innerHTML = header.title;
      link.onclick = () => window.location.href = window.location.pathname + `#${header.id}`;
      this.entries.push(link);
      parent.appendChild(link);

      // print version
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${header.id}">${header.title}</a>`;
      ul.appendChild(li);

      if (header.children.length > 0)
      {
        const section = document.createElement('div');
        section.className = 'markugen-toc-section';
        parent.appendChild(section);
        this.createLinks(header.children, section, ul, depth + 1);
      }
    }
  }

  addLinks(headers)
  {
    const toplevel = { parent: null, level: 0, children: [] };
    let previous = toplevel;
    for(let i = 0; i < headers.length; i++)
    {
      const header = headers[i];
      const hlevel = Number(header.tagName.slice(1));
      // it is a direct child
      if (hlevel >= previous.level + 1)
      {
        const link = {
          parent: previous,
          id: header.id,
          level: hlevel,
          title: header.innerHTML,
          children: [],
        };
        previous.children.push(link);
        previous = link;
      }
      // it is < previous.level + 1, need to find closest parent
      else
      {
        while (previous.level != 0 && hlevel < previous.level + 1)
          previous = previous.parent;
        i--;
      }
    }
    return toplevel;
  }

  onresize()
  {
    super.onresize();
    this.onscroll();
  }
  onscroll()
  {
    // nothing to do if hidden
    if (this.isAlwaysHidden()) return;

    let active = this.activeLink;
    for (const head of this.headers)
    {
      if (this.mark.isInView(head))
      {
        const link = document.querySelector(`div.markugen-toc-link[name="${head.id}"]`);
        if (link)
        {
          active = link;
          break;
        }
      }
    }
    if (active && active !== this.activeLink)
    {
      if (this.activeLink) this.activeLink.classList.toggle('active');
      active.classList.toggle('active');
      this.activeLink = active;
    }
    if (active) active.scrollIntoView(false);
  }
}

class Markugen
{
  body = null;
  navbar = null;
  navbarContents = null;
  title = null;
  contentRow = null;
  contentLeft = null;
  content = null;
  contentRight = null;
  footer = null;
  toolbar = null;
  themeToggle = null;
  markSitemap = null;
  markToc = null;
  prevNext = null;
  previous = null;
  next = null;

  pathToRoot = '';
  page = null;
  parentPage = null;
  previousPage = null;
  nextPage = null;

  constructor()
  {
    this.pathToRoot = this.currentPathToRoot(this.sitemap);
    this.createContent();
    this.markSitemap = new MarkugenSitemap(this);
    this.markToc = new MarkugenToc(this);
    this.setupTabs();
    this.createPrevNext();

    // hide sitemap if less than 2 entries
    if (this.markSitemap.isAlwaysHidden()) this.markSitemap.hideAlways();
    // hide toc if only less than 2 entries
    if (this.markToc.isAlwaysHidden()) this.markToc.hideAlways();
    
    // these should be done last
    window.addEventListener('resize', () => this.onresize());
    this.onresize();
    this.setTheme();
  }

  arrow(transform = '', width = '1em', height = '1em', color = 'var(--markugen-color)')
  {
    const style = transform === '' ? '' : ` style="transform: ${transform}"`;
    return `<svg width="${width}" height="${height}" viewBox="0 -960 960 960" fill="${color}"${style}><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>`
  }

  createContent()
  {
    // wrap the body in a centered div
    this.body = document.createElement('div');
    this.body.id = 'markugen-body';
    this.contentRow = document.createElement('div');
    this.contentRow.id = 'markugen-content-row';
    this.contentLeft = document.createElement('div');
    this.contentLeft.id = 'markugen-content-left';
    this.contentLeft.className = 'markugen-not-printable';
    this.content = document.createElement('div');
    this.content.id = 'markugen-content';
    this.contentRight = document.createElement('div');
    this.contentRight.id = 'markugen-content-right';
    this.contentRight.className = 'markugen-not-printable';

    // put the body in the center column, don't move scripts
    const children = [];
    for (const child of document.body.children)
      if (!/script/i.test(child.tagName))
        children.push(child);
    for (const child of children) this.content.appendChild(child);

    this.footer = document.createElement('div');
    this.footer.id = 'markugen-footer';
    if (this.sitemap.footer) this.footer.innerHTML = this.sitemap.footer;
    else
    {
      this.footer.innerHTML = `Generated by&nbsp;<a href="${this.markugen.homepage}" target=_blank>Markugen v${this.markugen.version}</a>`;
      if (this.markugen.timestamp)
      {
        let outdate = new Date();
        outdate.setTime(Date.parse(this.markugen.timestamp));
        const dateString = outdate.toLocaleString('en-US', {dateStyle:'long', timeStyle:'long'});
        this.footer.innerHTML += `&nbsp;on ${dateString}`;
      }
    }

    // add all the columns
    this.contentRow.appendChild(this.contentLeft);
    this.contentRow.appendChild(this.content);
    this.contentRow.appendChild(this.contentRight);
    this.body.appendChild(this.contentRow);
    this.body.appendChild(this.footer);
    document.body.appendChild(this.body);

    this.createNavbar();
  }

  createNavbar()
  {
    this.navbar = document.createElement('div');
    this.navbar.id = 'markugen-navbar';
    this.navbar.className = 'markugen-not-printable';
    document.body.appendChild(this.navbar);

    this.navbarContents = document.createElement('div');
    this.navbarContents.id = 'markugen-navbar-content';
    this.navbar.appendChild(this.navbarContents);

    this.title = document.createElement('div');
    this.title.id = 'markugen-navbar-title';
    this.title.innerHTML = `<a href="${this.pathToRoot}${this.sitemap.home}">${this.sitemap.title}</a>`;
    this.navbarContents.appendChild(this.title);

    this.toolbar = document.createElement('div');
    this.toolbar.id = 'markugen-navbar-toolbar';
    this.themeToggle = document.createElement('div');
    this.themeToggle.id = 'markugen-theme-toggle';
    this.themeToggle.onclick = () => this.toggleTheme();
    this.themeToggle.innerHTML = '<svg width="20px" height="20px" viewBox="0 -960 960 960" fill="var(--markugen-color)"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm40-83q119-15 199.5-104.5T800-480q0-123-80.5-212.5T520-797v634Z"/></svg>';
    this.toolbar.appendChild(this.themeToggle);
    this.navbarContents.appendChild(this.toolbar);
  }

  createPrevNext()
  {
    this.setPrevNext();
    this.prevNext = document.createElement('div');
    this.prevNext.id = 'markugen-prev-next-container';
    this.prevNext.className = 'markugen-not-printable';
    this.content.appendChild(this.prevNext);

    if (this.previousPage && this.previousPage.href)
    {
      this.previous = document.createElement('div');
      this.previous.className = 'markugen-prev-next prev';
      this.previous.innerHTML = `<div class="markugen-prev-next-title prev"><div>${this.arrow('rotate(180deg)')}</div><div>Previous</div></div>` +
        `<div class="markugen-prev-next-link prev"><a href="${this.pathToRoot}${this.previousPage.href}">${this.previousPage.title}</a></div>`;
      this.previous.onclick = () => window.location.href = this.pathToRoot + this.previousPage.href;
      this.prevNext.appendChild(this.previous);
    }

    if (this.nextPage && this.nextPage.href)
    {
      this.next = document.createElement('div');
      this.next.className = 'markugen-prev-next next';
      this.next.innerHTML = `<div class="markugen-prev-next-title next"><div>Next</div><div>${this.arrow()}</div></div>` +
        `<div class="markugen-prev-next-link next"><a href="${this.pathToRoot}${this.nextPage.href}">${this.nextPage.title}</a></div>`;
      this.next.onclick = () => window.location.href = this.pathToRoot + this.nextPage.href;
      this.prevNext.appendChild(this.next);
    }
  }

  setPrevNext()
  {
    const siblings = Object.values(this.parentPage.children);
    const index = siblings.indexOf(this.page);
    const children = this.page.children ? Object.values(this.page.children) : [];
    if (children.length > 0) this.nextPage = children[0];
    else this.nextPage = (index + 1 < siblings.length ? siblings[index + 1] : undefined);
    this.previousPage = (index - 1 >= 0 ? siblings[index - 1] : this.parentPage);
  }

  currentPathToRoot(parent)
  {
    // single page sites
    if (parent === this.sitemap && Object.keys(parent.children).length === 1)
    {
      this.parentPage = this.sitemap;
      this.page = Object.values(this.sitemap.children)[0];
      this.page.active = true;
      return '';
    }

    for(const child in parent.children)
    {
      const page = parent.children[child];
      let urlpath = window.location.pathname;
      // handle servers that auto show index.html pages
      if (urlpath.endsWith('/')) urlpath = urlpath + 'index.html';
      page.active = urlpath.endsWith(page.href);
      if (page.active)
      {
        let path = '';
        for(let i = 0; i < page.href.split(/\//g).length - 1; i++) path += '../';
        this.parentPage = parent;
        this.page = page;
        return path;
      }
      const path = this.currentPathToRoot(page);
      if (path) return path;
    }
    return '';
  }

  // toggles the current theme
  toggleTheme()
  {
    const html = document.getElementsByTagName('html')[0];
    html.className = html.className === 'dark' ? 'light' : 'dark';
    document.cookie = `theme=${html.className}`;
  }
  setTheme()
  {
    let theme = 'light';
    const decodedCookie = decodeURIComponent(document.cookie);
    const match = decodedCookie.match(/theme=(?<theme>(light)|(dark))/i);
    if (match && match.groups && match.groups.theme) theme = match.groups.theme;
    else if(window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
    const html = document.getElementsByTagName('html')[0];
    html.className = theme;
  }

  setupTabs()
  {
    const containers = document.querySelectorAll('.markugen-tabs-container');
    for (const tabs of containers)
    {
      const labels = tabs.querySelectorAll('.markugen-tab-label');
      for (const label of labels) label.onclick = () => this.tabClicked(label, tabs);
    }
  }
  tabClicked(label, container)
  {
    // nothing to do if already active
    if (label.classList.contains('active')) return;

    const name = label.getAttribute('name');
    const tab = container.querySelector(`div.markugen-tab[name="${name}"]`);
    if (tab)
    {
      // handle the tabs
      const ctab = container.querySelector('.markugen-tab:not(.markugen-hidden)');
      if (ctab) ctab.classList.add('markugen-hidden');
      tab.classList.remove('markugen-hidden');
      // handle the labels
      const clabel = container.querySelector('.markugen-tab-label.active');
      if (clabel) clabel.classList.remove('active');
      label.classList.add('active');
    }
  }

  onresize()
  {
    if (!this.markSitemap.isAlwaysHidden()) this.markSitemap.onresize();
    if (!this.markToc.isAlwaysHidden()) this.markToc.onresize();
  }

  isWidescreen() { return window.innerWidth >= 1200; }
  isInView(element)
  {
    const box = element.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom >= 0;
  }

  copyToClipboard(id, feedback = null)
  {
    let e = document.getElementById(id); 
    if(e) 
    { 
      const text = e.innerText || e.textContent;
      // clipboard unavailable over http
      if (navigator.clipboard && window.isSecureContext)
      {
        navigator.clipboard.writeText(text).then(() => {
          if (feedback)
          {
            const html = feedback.innerHTML;
            feedback.innerHTML = 'Copied!';
            setTimeout(() => feedback.innerHTML = html, 1000);
          }
        }); 
      }
      // use hidden text area when insecure
      else
      {
        // Use the 'out of viewport hidden text area' trick
        const textArea = document.createElement('textarea');
        textArea.value = text;
        // Move textarea out of the viewport so it's not visible
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.prepend(textArea);
        textArea.select();

        try { document.execCommand('copy'); } 
        catch (error) { console.error(error); } 
        finally {
          textArea.remove();
          if (feedback)
          {
            const html = feedback.innerHTML;
            feedback.innerHTML = 'Copied!';
            setTimeout(() => feedback.innerHTML = html, 1000);
          }
        }
      }
    }
  }
  saveToFile(id, filename, feedback = null)
  {
    let e = document.getElementById(id); 
    if(e) 
    { 
      const text = e.innerText || e.textContent;
      const link = document.createElement('a');
      const file = new Blob([text], { type: 'text/plain' });
      link.href = URL.createObjectURL(file);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      if (feedback)
      {
        const html = feedback.innerHTML;
        feedback.innerHTML = 'Saved!';
        setTimeout(() => feedback.innerHTML = html, 1000);
      }
    }
  }
    
  markugen = {{ return JSON.stringify(vars.markugen); }};
  sitemap = {{ return JSON.stringify(vars.sitemap); }};
}

const markugen = new Markugen();

