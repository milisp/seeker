import DiffViewer from "@/components/diff-viewer";
import { useWhaleStore } from "@/stores";

export function ReviewView() {
  const { fileChangesByTurn, threads, currentThreadId: threadId } = useWhaleStore();

  const lastTurnId = threads?.find((t) => t.id === threadId)?.latest_turn_id;
  const fileChanges = (lastTurnId && threadId && fileChangesByTurn[threadId]?.[lastTurnId]) || [];

  return (
    <div>
      {fileChanges.map((change) => (
        <div key={change.itemId}>
          {change.toolName === 'write_file' ? (
            <DiffViewer
              oldCode=""
              newCode={change.content || ''}
              filename={change.path}
              statusText="Created"
            />
          ) : (
            <DiffViewer
              oldCode={change.search || ''}
              newCode={change.replace || ''}
              filename={change.path}
              statusText="Edited"
            />
          )}
        </div>
      ))}
    </div>
  );
}