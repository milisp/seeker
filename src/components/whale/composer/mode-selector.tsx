import { Hand, LayoutList, OctagonAlert } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWhaleStore } from '@/components/whale/use-whale-store';
import { type WhaleMode } from '@/components/whale/types';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

export function ModeSelector() {
  const { t } = useTranslation("chat");
  const isMobile = useIsMobile();
  const { mode, setMode } = useWhaleStore();

  const options = [
    { value: 'agent' as WhaleMode, label: t("agent"), icon: <Hand className="h-3.5 w-3.5" /> },
    { value: 'plan' as WhaleMode, label: t("plan"), icon: <LayoutList className="h-3.5 w-3.5" /> },
    { value: 'yolo' as WhaleMode, label: t("yolo"), icon: <OctagonAlert className="h-3.5 w-3.5" /> },
  ];

  const currentOption = options.find((opt) => opt.value === mode);

  return (
    <Select value={mode} onValueChange={(value: WhaleMode) => setMode(value)}>
      <SelectTrigger className="bg-transparent shadow-none border-none focus:ring-0 focus:ring-offset-0 gap-2 p-2">
        <SelectValue>
          <div className="flex items-center gap-2">
            {currentOption?.icon}
            {!isMobile && (
              <span className="text-sm font-medium">
                {currentOption?.label || t("mode")}
              </span>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{t("mode")}</SelectLabel>
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className={isMobile ? "py-3 text-base" : "py-1.5 text-sm"}
            >
              <div className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}