export type AssignmentType = 'drill' | 'quiz' | 'roleplay' | 'assignment';

export type AssignmentSource = 'mila-command' | 'quick-action' | 'mistake-mission' | 'lesson-default';

export type RoleplayAssignment = {
  character: string;
  scene: string;
  goal: string;
};

export type Assignment = {
  id: string;
  type: AssignmentType;
  title: string;
  mentorMessage: string;
  targetWords: string[];
  targetRules: string[];
  mistakeWatch: string[];
  nextAction: string;
  source: AssignmentSource;
  roleplay?: RoleplayAssignment;
};

export type MissionStage = 'notice' | 'rule' | 'recall' | 'speak' | 'roleplay' | 'review';

export type MissionStatus = 'weak' | 'in_progress' | 'review_due' | 'strong';

export type Mission = {
  id: string;
  mistakeId: string;
  title: string;
  weakArea: string;
  wrong: string;
  correct: string;
  rule: string;
  stage: MissionStage;
  completedStages: MissionStage[];
  nextReview: string;
  status: MissionStatus;
  roleplay: RoleplayAssignment;
};
