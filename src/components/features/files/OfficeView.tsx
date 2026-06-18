import { useEffect, useRef, useState } from 'react';
import { readFile } from '@tauri-apps/plugin-fs';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { Loader2, FileText, Table, Presentation } from 'lucide-react';
import { useThemeContext } from '@/components/ThemeContext';
import { useFileViewStore } from '@/stores';

export function OfficeView() {
  const { selectedFilePath } = useFileViewStore();
  const { resolvedTheme } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [excelData, setExcelData] = useState<{ name: string; data: any[][] }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadFile = async () => {
      if (!selectedFilePath) return;
      setLoading(true);
      setError(null);
      setExcelData([]);

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

          <div className="shrink-0 px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
            {extension === 'docx' && <FileText className="h-4 w-4 text-primary" />}
            {extension === 'xlsx' && <Table className="h-4 w-4 text-primary" />}
            {extension === 'pptx' && <Presentation className="h-4 w-4 text-primary" />}
            <span className="text-sm font-medium truncate">
              {selectedFilePath.split(/[/\\]/).pop()}
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            <div
              className={`${extension === 'docx' ? 'block' : 'hidden'} mx-auto shadow-sm max-w-[816px] min-h-full docx-wrapper`}
              ref={containerRef}
            />

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
      `}</style>
    </div>
  );
}
