import { useState, useEffect, useRef } from 'react';
import { CreateThread, sendPrompt, turnInterrupt } from '@/services/tauri';
import { Send, Plus, SquareStop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelect } from '@/components/whale/composer/intelligent';
import { useWhaleStore } from '@/components/whale/use-whale-store';
import { ModeSelector } from './mode-selector';
import { useWorkspaceStore } from '@/stores';
import { useTranslation } from 'react-i18next';

interface ComposerProps {
  variant?: 'single' | 'double';
  autoFocus?: boolean;
}

export function Composer({ variant = 'double', autoFocus = true }: ComposerProps) {
  const { t } = useTranslation("chat");
  const { cwd } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { unavailable, currentThreadId, setCurrentThreadId, currentTurnStatus, model, mode, focusTrigger, currentReasoningEffort, threads, setThreads } =
    useWhaleStore();
  const canSubmit = input.trim() && !unavailable;

  const isMultiLine = variant === 'double';

  useEffect(() => {
    if (autoFocus && !unavailable) {
      textareaRef.current?.focus();
    }
  }, [autoFocus, unavailable]);

  useEffect(() => {
    if (focusTrigger > 0 && !unavailable) {
      textareaRef.current?.focus();
    }
  }, [focusTrigger, unavailable]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');

    try {
      let threadId = currentThreadId;

      if (!threadId) {
        const result = await CreateThread({
          workspace: cwd ?? '',
          model: model,
          mode: mode,
          allow_shell: mode !== 'plan',
          trust_mode: mode === 'yolo',
          auto_approve: mode === 'yolo',
        });
        threadId = result.thread.id;
        if (threadId) {
          setThreads([
            {
              ...result.thread,
              title: "New Thread",
              preview: "",
              branch: "main",
              head: "",
              dirty: false,
              latest_turn_id: "",
              latest_turn_status: "",
            },
            ...threads,
          ]);
          setCurrentThreadId(threadId);
        }
      }

      if (threadId) {
        await sendPrompt(threadId, text, model, currentReasoningEffort);
      }
    } catch (err) {
      console.error('[whale] send error:', err);
    }
  };

  return (
    <footer className="w-full">
      <div
        className={`flex border rounded-lg transition-all
          ${unavailable ? 'opacity-50 bg-muted/30 pointer-events-none' : ''}
          focus-within:ring-1 focus-within:ring-ring focus-within:border-ring
          ${isMultiLine ? 'flex-col items-stretch' : 'flex-row items-center'}`}
      >
        {!isMultiLine && (
          <>
            <Button size="icon" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
            <ModeSelector />
          </>
        )}

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) {
                handleSend();
              }
            }
          }}
          placeholder={t('askAnything')}
          disabled={unavailable}
          className="flex-1 resize-none min-h-[32px] p-2 max-h-[180px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 leading-tight"
        />

        <div
          className={`flex items-center ${isMultiLine ? 'justify-between mt-1' : 'flex-shrink-0'
            }`}
        >
          {isMultiLine && (
            <>
              <Button size="icon" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
              <ModeSelector />
            </>
          )}

          <div className="flex items-center ml-auto px-1">
            <ModelSelect />
            <Button
              size="icon"
              variant={`${currentTurnStatus === 'in_progress' ? 'destructive' : 'default'}`}
              disabled={currentTurnStatus !== 'in_progress' && !canSubmit}
              onClick={() => {
                if (currentTurnStatus === 'in_progress') {
                  turnInterrupt();
                } else {
                  handleSend();
                }
              }}
              className="h-8 w-8 rounded-md flex-shrink-0"
            >
              {currentTurnStatus === 'in_progress' ? (
                <SquareStop className="h-4 w-4 text-red-500" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}