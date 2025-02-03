
export interface PdfOptions
{
  /**
   * Specifies the input directory to search for html files in or a list of
   * file paths to convert to PDFs.
   */
  input:string|string[],
  /**
   * If true, the html files will be removed after the PDF 
   * files are generated. [default: false]
   */
  remove?:boolean,
  /**
   * A list of extensions to convert to pdfs [default: ['html']]
   */
  extensions?:string[],
  /**
   * If true, Markdown links generated by Markugen will be converted to link
   * to PDF files instead of HTML. [default: true]
   */
  links?:boolean,
}