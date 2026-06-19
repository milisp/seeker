import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { listSkills, toggleSkill } from '@/services/tauri';
import type { Skill } from '@/services/types';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SkillsView() {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    listSkills().then((res: any) => {
      setSkills(res.skills);
    });
  }, []);

  const handleToggle = (name: string, currentStatus: boolean) => {
    toggleSkill(name, !currentStatus).then(() => {
      setSkills((prev) =>
        prev.map((skill) =>
          skill.name === name ? { ...skill, enabled: !currentStatus } : skill
        )
      );
    });
  };

  return (
    <div className="h-screen overflow-y-auto p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {skills.map((skill) => (
          <Card key={skill.name} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Package className="h-8 w-8 flex-shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold truncate">{skill.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {skill.description}
                  </span>
                </div>
              </div>

              <Switch
                className="shrink-0 border-none data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted"
                checked={skill.enabled}
                onCheckedChange={() => handleToggle(skill.name, skill.enabled)}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}