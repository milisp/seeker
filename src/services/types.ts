export type Skill = {
  name: string;
  description: string;
  path: string;
  enabled: boolean;
  is_bundled: boolean;
};

export type ToggleSkillResponse = {
  enabled: boolean;
  name: string;
}

export type ListSkillsResponse = {
  skills: Skill[];
}
