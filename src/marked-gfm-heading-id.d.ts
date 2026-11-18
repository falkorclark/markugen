// temporary fix for missing typescript definitions for marked-gfm-heading-id 4.1.4
declare module 'marked-gfm-heading-id' 
{
  import type { MarkedExtension } from 'marked';

  export interface GfmHeadingIdOptions {
    prefix?: string;
    globalSlugs?: boolean;
  }

  export interface HeadingData {
    text: string;
    level: number;
    raw: string;
    id: string;
  }

  export function gfmHeadingId(options?: GfmHeadingIdOptions): MarkedExtension;
  export function getHeadingList(): HeadingData[];
  export function resetHeadings(): void;
}
