import { mdToPdf } from 'md-to-pdf'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1f2937;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
  }

  h1 {
    color: #ea580c;
    font-size: 32px;
    font-weight: 800;
    border-bottom: 4px solid #fb923c;
    padding-bottom: 16px;
    margin-top: 0;
  }

  h2 {
    color: #1e40af;
    font-size: 22px;
    font-weight: 700;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  h3 {
    color: #374151;
    font-size: 17px;
    font-weight: 600;
    margin-top: 20px;
  }

  h4 {
    color: #4b5563;
    font-size: 14px;
    font-weight: 600;
    margin-top: 14px;
    margin-bottom: 6px;
  }

  p, li { font-size: 14px; }

  strong { color: #111827; font-weight: 700; }

  code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Menlo', monospace;
    font-size: 13px;
    color: #ea580c;
  }

  pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Menlo', monospace;
    font-size: 12px;
    overflow-x: auto;
    margin: 12px 0;
  }
  pre code { background: transparent; color: inherit; padding: 0; }

  blockquote {
    border-left: 4px solid #fb923c;
    background: #fff7ed;
    padding: 12px 20px;
    margin: 16px 0;
    border-radius: 4px;
    font-size: 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 14px;
  }
  th, td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    background: #fef3c7;
    font-weight: 600;
    color: #78350f;
  }
  tr:nth-child(even) { background: #fafafa; }

  ul, ol { padding-left: 24px; }
  li { margin: 4px 0; }

  hr { border: 0; border-top: 2px dashed #e5e7eb; margin: 24px 0; }
`

;(async () => {
  const pdf = await mdToPdf(
    { path: path.join(root, 'NOVEDADES-FEEDBACK-14-MAY.md') },
    {
      dest: path.join(root, 'NOVEDADES-FEEDBACK-14-MAY.pdf'),
      css,
      pdf_options: {
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="width: 100%; text-align: center; font-size: 9px; color: #9ca3af; padding: 0 15mm;">
          <span>CRM Ofimatic Baix · Historial de Tareas · 14 May 2026</span>
          <span style="margin-left: 20px;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>`,
      },
    }
  )

  if (pdf) {
    console.log(`PDF generado: ${path.join(root, 'NOVEDADES-FEEDBACK-14-MAY.pdf')}`)
  } else {
    console.error('Error generando PDF')
    process.exit(1)
  }
})()
