import { getDate } from '../utils/get-date';
import { WhaleEvent, TurnInfo } from '../types';
import { Streamdown } from 'streamdown';
import { ItemFailed } from './ItemFail';
import { useWhaleStore } from '@/components/whale/useWhaleStore';
import { CopyIcon } from '@/components/CopyIcon';
import { Badge } from '@/components/ui/badge';
import { ToolCallItem } from './ToolCall';

type Props = {
  activeEvents: WhaleEvent[];
  maxContentW?: string;
};

interface EventItemFooterProps {
  ev: WhaleEvent;
}

function EventItemFooter({ ev }: EventItemFooterProps) {
  const created_at = getDate(ev.params.created_at);
  return (
    <div className="text-muted-foreground text-sm">
      {created_at} {ev.method}{' '}
      {(
        ((ev.params.turn?.duration_ms || 0) as number) / 1000
      ).toFixed(2)}
      s
    </div>
  );
}

export function EventItem({ activeEvents, maxContentW }: Props) {
  const { toolCallEventsByItemId } = useWhaleStore();
  return (
    <>
      {activeEvents.map((ev: WhaleEvent) => (
        <div key={ev.params.seq}>
          {(() => {
            const created_at = getDate(ev.params.created_at);
            switch (ev.method) {
              case 'item.delta':
              case 'turn.started':
              case 'turn.failed':
              case 'thread.started':
              case 'turn.lifecycle':
              case 'approval.required':
              case 'approval.timeout':
              case 'approval.decided':
              case 'item.started':
              case 'item.interrupted':
              case 'turn.interrupt_requested':
                return null
              case 'turn.completed': {
                const turn = ev.params.turn as TurnInfo
                if (turn.status === 'interrupted') {
                  return <Badge variant="destructive">{turn.status}</Badge>;
                }
                return null
              }

              case 'item.failed': {
                const itemId = ev.params.item_id as string;
                const stored = toolCallEventsByItemId[itemId];
                // If we have the original tool payload, show it as a failed card
                if (stored?.inputEvent?.params.payload?.tool) {
                  return null; // rendered by item.started (reads outputEvent from store)
                }
                return (
                  <ItemFailed
                    kind={ev.params.item?.kind as string}
                    summary={ev.params.item?.summary as string}
                  />
                );
              }

              case 'item.completed': {
                const kind = ev.params.item?.kind as string;
                const content = ev.params.item?.detail as string;

                const itemId = ev.params.item_id as string;
                const stored = toolCallEventsByItemId[itemId];
                const inputEvent = stored?.inputEvent ?? ev;
                // Any item with a tool payload gets a collapsible ToolCallItem
                // regardless of kind — this covers tool_call AND file_change.
                if (inputEvent.params.payload?.tool) {
                  return (
                    <ToolCallItem itemId={itemId} inputEvent={inputEvent} />
                  );
                }
                switch (kind) {
                  case 'user_message':
                  case 'agent_message': {
                    const isUser = kind === 'user_message';
                    return (
                      <div className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`${maxContentW} ${isUser ? 'bg-secondary text-secondary-foreground' : ''}`}>
                          <Streamdown>{content}</Streamdown>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!isUser && <CopyIcon content={content} />}
                          <span>{created_at}</span>
                          {isUser && <CopyIcon content={content} />}
                        </div>
                      </div>
                    );
                  }
                  case 'status':
                  case 'command_execution':
                    return null;
                  default:
                    return (
                      <div>
                        <div className="flex max-h-32 overflow-auto">
                          <pre>{JSON.stringify(ev, null, 2) || ''}</pre>
                        </div>
                        <EventItemFooter ev={ev} />
                      </div>
                    );
                }
              }

              default:
                return (
                  <div>
                    <div>{ev.method}</div>
                    <EventItemFooter ev={ev} />
                  </div>
                );
            }
          })()}
        </div>
      ))}
    </>
  );
}
