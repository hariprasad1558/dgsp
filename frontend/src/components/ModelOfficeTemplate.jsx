import React, { useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import './ModelOfficeTemplate.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function ModelOfficeTemplate() {
  const templatePdfPath = '/templates/model-officer-template.pdf';
  const [numPages, setNumPages] = useState(null);
  const [leftPage, setLeftPage] = useState(1);

  const rightPage = useMemo(() => {
    if (!numPages || leftPage >= numPages) {
      return null;
    }

    return leftPage + 1;
  }, [leftPage, numPages]);

  const canGoPrev = leftPage > 1;
  const canGoNext = Boolean(numPages && leftPage + 1 < numPages);

  const goPrev = () => {
    setLeftPage((prev) => Math.max(1, prev - 2));
  };

  const goNext = () => {
    if (!numPages) return;
    setLeftPage((prev) => Math.min(numPages, prev + 2));
  };

  const onDocumentLoadSuccess = ({ numPages: totalPages }) => {
    setNumPages(totalPages);
    setLeftPage(1);
  };

  const downloadPagePdf = async (pageNumber) => {
    try {
      const response = await fetch(templatePdfPath);
      const srcBytes = await response.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBytes);
      const outDoc = await PDFDocument.create();
      const [copiedPage] = await outDoc.copyPages(srcDoc, [pageNumber - 1]);
      outDoc.addPage(copiedPage);
      const outBytes = await outDoc.save();

      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `model-officer-template-page-${pageNumber}.pdf`;
      anchor.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.alert('Unable to download selected page. Please try again.');
    }
  };

  return (
    <div className="template-page-wrap">
      <div className="template-card">
        <div className="template-toolbar">
          <h2>Model Office Template</h2>

          <div className="template-actions">
            <button type="button" onClick={goPrev} disabled={!canGoPrev}>
              Previous
            </button>

            <button type="button" onClick={goNext} disabled={!canGoNext}>
              Next
            </button>

            <a href={templatePdfPath} download="model-officer-template.pdf">
              Download Full PDF
            </a>
          </div>
        </div>

        <div className="template-status">
          {numPages ? `Showing pages ${leftPage}${rightPage ? `-${rightPage}` : ''} of ${numPages}` : 'Loading PDF...'}
        </div>

        <Document file={templatePdfPath} onLoadSuccess={onDocumentLoadSuccess} className="template-document">
          <div className="book-spread">
            <div className="book-page">
              <Page pageNumber={leftPage} renderTextLayer={false} renderAnnotationLayer={false} width={460} />
              <button type="button" className="page-download-btn" onClick={() => downloadPagePdf(leftPage)}>
                Download Page {leftPage}
              </button>
            </div>

            <div className="book-page">
              {rightPage ? (
                <>
                  <Page pageNumber={rightPage} renderTextLayer={false} renderAnnotationLayer={false} width={460} />
                  <button type="button" className="page-download-btn" onClick={() => downloadPagePdf(rightPage)}>
                    Download Page {rightPage}
                  </button>
                </>
              ) : (
                <div className="book-empty-page">No more pages</div>
              )}
            </div>
          </div>
        </Document>
      </div>
    </div>
  );
}

export default ModelOfficeTemplate;
