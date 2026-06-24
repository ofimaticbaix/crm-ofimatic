import { mdToPdf } from 'md-to-pdf'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1f2937;
    line-height: 1.65;
    max-width: 820px;
    margin: 0 auto;
    padding: 40px;
  }

  h1 {
    color: #ea580c;
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -1px;
    margin: 0 0 4px 0;
    line-height: 1.1;
  }

  h1 + h3 {
    color: #6b7280;
    font-size: 18px;
    font-weight: 500;
    margin-top: 0;
    margin-bottom: 28px;
    border-bottom: 3px solid #fb923c;
    padding-bottom: 20px;
  }

  h2 {
    color: #1e3a8a;
    font-size: 26px;
    font-weight: 800;
    margin-top: 40px;
    margin-bottom: 14px;
    padding: 14px 20px;
    background: linear-gradient(90deg, #fff7ed 0%, #ffffff 100%);
    border-left: 5px solid #ea580c;
    border-radius: 4px;
  }

  h3 {
    color: #1f2937;
    font-size: 18px;
    font-weight: 700;
    margin-top: 24px;
    margin-bottom: 8px;
  }

  p, li {
    font-size: 14.5px;
  }

  strong {
    color: #1e3a8a;
    font-weight: 700;
  }

  em {
    color: #6b7280;
    font-style: italic;
  }

  code {
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Menlo', monospace;
    font-size: 13px;
    color: #92400e;
  }

  blockquote {
    border-left: 5px solid #ea580c;
    background: linear-gradient(90deg, #fff7ed 0%, #ffffff 100%);
    padding: 18px 26px;
    margin: 24px 0;
    border-radius: 6px;
    font-size: 15px;
    color: #1f2937;
  }

  blockquote p:first-child {
    margin-top: 0;
  }

  blockquote p:last-child {
    margin-bottom: 0;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 24px 0;
    font-size: 14px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%);
    color: white;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tr:nth-child(even) td { background: #fafafa; }
  tr:last-child td { border-bottom: none; }
  tr td:first-child { font-weight: 600; color: #1e3a8a; }

  ul, ol {
    padding-left: 22px;
  }

  li {
    margin: 6px 0;
  }

  hr {
    border: 0;
    border-top: 2px dashed #fed7aa;
    margin: 32px 0;
  }

  /* Styling for emoji sections */
  h3:has(+ p em:only-child),
  p em:only-child {
    color: #6b7280;
  }
`

;(async () => {
  const pdf = await mdToPdf(
    { path: path.join(root, 'CRM-SaaS-Presentacion.md') },
    {
      dest: path.join(root, 'CRM-SaaS-Presentacion.pdf'),
      css,
      pdf_options: {
        format: 'A4',
        margin: { top: '18mm', bottom: '20mm', left: '15mm', right: '15mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `<div style="width: 100%; text-align: center; font-size: 9px; color: #9ca3af; padding: 0 15mm;">
          <span style="color: #ea580c; font-weight: 600;">CRM Ofimatic</span>
          <span style="margin: 0 10px; color: #d1d5db;">|</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          <span style="margin-left: 20px; color: #9ca3af;">comercial@ofimaticbaix.com</span>
        </div>`,
      },
    }
  )

  if (pdf) {
    console.log(`PDF comercial generado: ${path.join(root, 'CRM-SaaS-Presentacion.pdf')}`)
  } else {
    console.error('Error generando PDF')
    process.exit(1)
  }
})()
