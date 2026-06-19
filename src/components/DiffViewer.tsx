import React, { useMemo, useState } from 'react';
import { createPatch } from 'diff';
import { ChevronRight, Copy, Check } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'del' | 'ctx' | 'hunk';
  content: string;
  oldNo?: number;
  newNo?: number;
}

export interface DiffViewerProps {
  filename?: string;
  oldCode?: string;
  newCode?: string;
  rawDiff?: string;
  viewType?: 'split' | 'unified';
  defaultCollapsed?: boolean;
  statusText?: string;
}

export interface DiffHeaderProps extends DiffViewerProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showArrow?: boolean;
  onCopy?: () => void;
}

export interface DiffContentProps {
  lines: DiffLine[];
  viewType?: 'split' | 'unified';
}

function parseDiff(diffText: string): { filename: string; lines: DiffLine[]; stats: { add: number; del: number } } {
  const rawLines = diffText.split('\n');
  const lines: DiffLine[] = [];
  let filename = '';
  let oldNo = 0;
  let newNo = 0;
  let addCount = 0;
  let delCount = 0;

  for (const raw of rawLines) {
    if (raw.startsWith('--- ') || raw.startsWith('+++ ')) {
      filename = raw.slice(4).replace(/\t.*$/, '').trim();
      continue;
    }
    if (raw.startsWith('@@')) {
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldNo = parseInt(m[1], 10);
        newNo = parseInt(m[2], 10);
      }
      lines.push({ type: 'hunk', content: raw });
      continue;
    }
    if (raw.startsWith('+')) {
      lines.push({ type: 'add', content: raw.slice(1), newNo: newNo++ });
      addCount++;
    } else if (raw.startsWith('-')) {
      lines.push({ type: 'del', content: raw.slice(1), oldNo: oldNo++ });
      delCount++;
    } else if (raw.startsWith(' ') || (!raw.startsWith('\\') && lines.length > 0)) {
      if (raw === '' || raw.startsWith(' ')) {
        lines.push({ type: 'ctx', content: raw.startsWith(' ') ? raw.slice(1) : '', oldNo: oldNo++, newNo: newNo++ });
      }
    }
  }

  return { filename, lines, stats: { add: addCount, del: delCount } };
}

export const useDiffData = (filename = 'file.txt', oldCode?: string, newCode?: string, rawDiff?: string) => {
  return useMemo(() => {
    let diffText = '';
    if (rawDiff) {
      diffText = rawDiff;
    } else if (oldCode !== undefined && newCode !== undefined) {
      diffText = createPatch(filename, oldCode, newCode, '', '', { context: 3 });
    } else {
      return { displayName: filename, lines: [] as DiffLine[], stats: { add: 0, del: 0 } };
    }
    const parsed = parseDiff(diffText);
    const displayName = parsed.filename && parsed.filename !== 'file.txt' ? parsed.filename : filename;
    return { displayName, lines: parsed.lines, stats: parsed.stats };
  }, [rawDiff, oldCode, newCode, filename]);
};

export const DiffHeader: React.FC<DiffHeaderProps> = ({
  filename = 'file.txt',
  oldCode,
  newCode,
  rawDiff,
  statusText,
  isCollapsed,
  onToggleCollapse,
  showArrow = true,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);
  const { displayName, stats } = useDiffData(filename, oldCode, newCode, rawDiff);

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onToggleCollapse}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderBottom: isCollapsed ? 'none' : '1px solid var(--diff-border, rgba(148, 163, 184, 0.15))',
        backgroundColor: 'var(--diff-hunk-bg, rgba(148, 163, 184, 0.04))',
        cursor: onToggleCollapse ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {showArrow && onToggleCollapse && (
          <ChevronRight
            size={14}
            style={{
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
              transition: 'transform 0.15s ease',
              color: 'var(--diff-header-color, #475569)',
            }}
          />
        )}
        {statusText && (
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--diff-gutter-color, #64748b)',
            marginRight: '2px',
          }}>
            {statusText}
          </span>
        )}
        <span style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--diff-header-color, #475569)',
        }}>
          {displayName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '0.72rem',
          fontWeight: 600,
          display: 'flex',
          gap: '6px'
        }}>
          <span style={{ color: 'var(--diff-add-text, #16a34a)' }}>+{stats.add}</span>
          <span style={{ color: 'var(--diff-del-text, #dc2626)' }}>-{stats.del}</span>
        </div>

        {onCopy && (
          <button
            onClick={handleCopyClick}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--diff-header-color, #475569)',
              opacity: 0.7,
              transition: 'opacity 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            {copied ? <Check size={13} style={{ color: 'var(--diff-add-text, #16a34a)' }} /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const DiffContent: React.FC<DiffContentProps> = ({ lines, viewType = 'unified' }) => {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.78rem',
    lineHeight: '1.5',
  };

  const gutterStyle = (bg: string): React.CSSProperties => ({
    width: '4.5ch',
    minWidth: '4.5ch',
    textAlign: 'right',
    padding: '0 8px',
    userSelect: 'none',
    color: 'var(--diff-gutter-color, #64748b)',
    backgroundColor: bg,
    borderRight: '1px solid var(--diff-border, rgba(148, 163, 184, 0.15))',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  });

  const codeStyle = (bg: string, color?: string): React.CSSProperties => ({
    padding: '0 8px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    backgroundColor: bg,
    color: color ?? 'var(--diff-code-color, inherit)',
    verticalAlign: 'top',
  });

  const renderUnified = () =>
    lines.map((line, i) => {
      if (line.type === 'hunk') return null;

      const isAdd = line.type === 'add';
      const isDel = line.type === 'del';

      const gutterBg = isAdd ? 'var(--diff-add-gutter, rgba(22, 163, 74, 0.15))' : isDel ? 'var(--diff-del-gutter, rgba(220, 38, 38, 0.15))' : 'transparent';
      const codeBg = isAdd ? 'var(--diff-add-bg, rgba(22, 163, 74, 0.06))' : isDel ? 'var(--diff-del-bg, rgba(220, 38, 38, 0.06))' : 'transparent';
      const codeColor = isAdd ? 'var(--diff-add-text, #16a34a)' : isDel ? 'var(--diff-del-text, #dc2626)' : undefined;
      const prefix = isAdd ? '+' : isDel ? '-' : ' ';

      return (
        <tr key={i}>
          <td style={gutterStyle(gutterBg)}>{isDel ? line.oldNo : isAdd ? '' : line.oldNo}</td>
          <td style={gutterStyle(gutterBg)}>{isDel ? '' : isAdd ? line.newNo : line.newNo}</td>
          <td style={codeStyle(codeBg, codeColor)}>
            <span style={{ color: isAdd ? 'var(--diff-add-text, #16a34a)' : isDel ? 'var(--diff-del-text, #dc2626)' : 'var(--diff-gutter-color, #64748b)', marginRight: 6, userSelect: 'none' }}>
              {prefix}
            </span>
            {line.content}
          </td>
        </tr>
      );
    });

  const renderSplit = () => {
    const paired: Array<{ left?: DiffLine; right?: DiffLine }> = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type === 'hunk') {
        i++;
        continue;
      }
      if (line.type === 'del') {
        const next = lines[i + 1];
        if (next && next.type === 'add') {
          paired.push({ left: line, right: next });
          i += 2;
          continue;
        }
        paired.push({ left: line });
        i++;
        continue;
      }
      if (line.type === 'add') {
        paired.push({ right: line });
        i++;
        continue;
      }
      paired.push({ left: line, right: line });
      i++;
    }

    return paired.map((pair, i) => {
      const { left, right } = pair;
      const isCtx = left?.type === 'ctx';

      const leftBg = left?.type === 'del' ? 'var(--diff-del-bg, rgba(220, 38, 38, 0.06))' : 'transparent';
      const rightBg = right?.type === 'add' ? 'var(--diff-add-bg, rgba(22, 163, 74, 0.06))' : 'transparent';
      const leftGBg = left?.type === 'del' ? 'var(--diff-del-gutter, rgba(220, 38, 38, 0.15))' : 'transparent';
      const rightGBg = right?.type === 'add' ? 'var(--diff-add-gutter, rgba(22, 163, 74, 0.15))' : 'transparent';

      const leftColor = left?.type === 'del' ? 'var(--diff-del-text, #dc2626)' : undefined;
      const rightColor = right?.type === 'add' ? 'var(--diff-add-text, #16a34a)' : undefined;

      return (
        <tr key={i}>
          <td style={gutterStyle(leftGBg)}>{left?.oldNo ?? ''}</td>
          <td style={codeStyle(leftBg, leftColor)}>
            {left ? (
              <>
                {left.type === 'del' && (
                  <span style={{ color: 'var(--diff-del-text, #dc2626)', marginRight: 6, userSelect: 'none' }}>-</span>
                )}
                {isCtx && <span style={{ color: 'var(--diff-gutter-color, #64748b)', marginRight: 6, userSelect: 'none' }}> </span>}
                {left.content}
              </>
            ) : null}
          </td>
          <td style={gutterStyle(rightGBg)}>{right?.newNo ?? ''}</td>
          <td style={codeStyle(rightBg, rightColor)}>
            {right ? (
              <>
                {right.type === 'add' && (
                  <span style={{ color: 'var(--diff-add-text, #16a34a)', marginRight: 6, userSelect: 'none' }}>+</span>
                )}
                {isCtx && <span style={{ color: 'var(--diff-gutter-color, #64748b)', marginRight: 6, userSelect: 'none' }}> </span>}
                {right.content}
              </>
            ) : null}
          </td>
        </tr>
      );
    });
  };

  return (
    <table style={tableStyle}>
      <tbody>
        {viewType === 'split' ? renderSplit() : renderUnified()}
      </tbody>
    </table>
  );
};

const DiffViewer: React.FC<DiffViewerProps> = ({
  filename = 'file.txt',
  oldCode,
  newCode,
  rawDiff,
  viewType = 'unified',
  defaultCollapsed = true,
  statusText,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { lines } = useDiffData(filename, oldCode, newCode, rawDiff);

  const handleCopy = () => {
    const textToCopy = newCode ?? rawDiff ?? '';
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  if (lines.length === 0) return null;

  return (
    <div style={{
      margin: '12px 0',
      borderRadius: 6,
      border: '1px solid var(--diff-border, rgba(148, 163, 184, 0.15))',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      backgroundColor: 'var(--diff-panel-bg, transparent)',
    }}>
      <DiffHeader
        filename={filename}
        oldCode={oldCode}
        newCode={newCode}
        rawDiff={rawDiff}
        statusText={statusText}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onCopy={handleCopy}
      />

      <div style={{ overflowX: 'auto', display: isCollapsed ? 'none' : 'block' }}>
        <DiffContent lines={lines} viewType={viewType} />
      </div>
    </div>
  );
};

export default DiffViewer;