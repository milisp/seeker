import { useEffect, useRef, useState } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { Loader2, FileText, Table, Presentation, FileCode, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useThemeContext } from '@/components/ThemeContext';
import { useFileViewStore } from '@/stores';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export function OfficeView() {
  const { selectedFilePath } = useFileViewStore();
  const { resolvedTheme } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [excelData, setExcelData] = useState<{ name: string; data: any[][] }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  useEffect(() => {
    let isActive = true;

    const loadFile = async () => {
      if (!selectedFilePath) return;
      setLoading(true);
      setError(null);
      setExcelData([]);
      setPdfBlob(null);
      setNumPages(null);
      setScale(1.0);

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        const data = await readFile(selectedFilePath);
        const ext = selectedFilePath.split('.').pop()?.toLowerCase();

        if (isActive) {
          if (ext === 'docx') {
            if (containerRef.current) {
              const blob = new Blob([data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              });
              await renderAsync(blob, containerRef.current, undefined, {
                className: 'docx-preview-container',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false,
                debug: false,
              });
            }
          } else if (ext === 'xlsx' || ext === 'xls') {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheets = workbook.SheetNames.map((name) => ({
              name,
              data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }) as any[][],
            }));
            setExcelData(sheets);
          } else if (ext === 'pdf') {
            const blob = new Blob([data], { type: 'application/pdf' });
            setPdfBlob(blob);
          } else if (ext === 'pptx') {
            setError('PPTX preview is currently not supported. Please open with native app.');
          }
        }
      } catch (err) {
        console.error('OfficeView error:', err);
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to display file');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadFile();

    return () => {
      isActive = false;
    };
  }, [selectedFilePath]);

  if (!selectedFilePath) {
    return <div className="flex-1 text-sm text-muted-foreground p-6">Select an office file.</div>;
  }

  const extension = selectedFilePath.split('.').pop()?.toLowerCase();

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setScale(1.0);

  return (
    <div
      className="flex flex-1 min-h-0 flex-col bg-background overflow-hidden"
      data-color-mode={resolvedTheme}
    >
      {error ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">Path: {selectedFilePath}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-[2px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          <div className="shrink-0 px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {extension === 'docx' && <FileText className="h-4 w-4 text-primary" />}
              {extension === 'xlsx' && <Table className="h-4 w-4 text-primary" />}
              {extension === 'pptx' && <Presentation className="h-4 w-4 text-primary" />}
              {extension === 'pdf' && <FileCode className="h-4 w-4 text-primary" />}
              <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-sm">
                {selectedFilePath.split(/[/\\]/).pop()}
              </span>
            </div>

            {extension === 'pdf' && pdfBlob && (
              <div className="flex items-center gap-1 border rounded-md p-0.5 bg-background shadow-sm">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-40"
                  title="缩小"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-mono px-1 min-w-[36px] text-center select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 2.0}
                  className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-40"
                  title="放大"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <div className="w-[1px] h-3 bg-border mx-0.5" />
                <button
                  onClick={handleResetZoom}
                  className="p-1 hover:bg-muted rounded text-muted-foreground"
                  title="重置缩放"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            <div
              className={`${extension === 'docx' ? 'block' : 'hidden'} mx-auto shadow-sm max-w-[816px] min-h-full docx-wrapper`}
              ref={containerRef}
            />

            {extension === 'pdf' && pdfBlob && (
              <div className="flex flex-col items-center justify-start min-h-full bg-muted/10 p-2">
                <Document
                  file={pdfBlob}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={
                    <div className="flex p-6 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  }
                  error={
                    <p className="text-sm text-destructive p-6">Failed to load PDF document.</p>
                  }
                  className="flex flex-col gap-4"
                >
                  {Array.from(new Array(numPages || 0), (_, index) => (
                    <div key={`page_${index + 1}`} className="shadow-md bg-white rounded overflow-hidden">
                      <Page
                        pageNumber={index + 1}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        scale={scale}
                      />
                    </div>
                  ))}
                </Document>
              </div>
            )}

            {(extension === 'xlsx' || extension === 'xls') && excelData.length > 0 && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto border rounded-md bg-card">
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      {excelData[activeSheet]?.data.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-muted/30 border-b last:border-0 border-border/50"
                        >
                          <td className="bg-muted/50 border-r border-border/50 px-2 py-1 text-center font-mono text-muted-foreground w-8 select-none">
                            {i + 1}
                          </td>
                          {Array.from({
                            length: Math.max(...excelData[activeSheet].data.map((r) => r.length)),
                          }).map((_, j) => (
                            <td
                              key={j}
                              className="border-r border-border/50 last:border-0 px-3 py-1 whitespace-nowrap min-w-[80px] text-foreground"
                            >
                              {row[j] !== undefined ? String(row[j]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {excelData.length > 1 && (
                  <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                    {excelData.map((sheet, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSheet(idx)}
                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${activeSheet === idx
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                          }`}
                      >
                        {sheet.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .docx-wrapper {
          padding: 2rem !important;
          background: white !important;
          color: black !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .docx-preview-container {
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.3);
        }
        [data-color-mode='dark'] .docx-wrapper {
          filter: invert(0.9) hue-rotate(180deg);
        }
        [data-color-mode='dark'] .docx-wrapper img {
          filter: invert(1) hue-rotate(180deg);
        }
        [data-color-mode='dark'] .react-pdf__Page {
          filter: invert(0.9) hue-rotate(180deg);
        }
        [data-color-mode='dark'] .react-pdf__Page canvas {
          filter: none;
        }
      `}</style>
    </div>
  );
}