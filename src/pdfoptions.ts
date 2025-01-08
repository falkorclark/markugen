

export default interface PdfOptions
{
  /**
   * Specifies the input directory to search for html files in or a list of
   * file paths to convert to PDFs.
   */
  input:string|string[],
  /**
   * The path to the Chrome or Firefox executable. If not given, a Chrome 
   * browser will attempt to be found.
   */
  browser?:string,
  /**
   * If true, the html files will be removed after the PDF files are generated.
   */
  remove?:boolean,
  /**
   * A list of extensions to convert to pdfs [default: ['html']]
   */
  extensions?:string[],
}