import type { Mistake } from './lesson';
import type { Assignment, Mission, MissionStage } from './types';

export const missionStages: MissionStage[] = ['notice', 'rule', 'recall', 'speak', 'roleplay', 'review'];

const stageLabels: Record<MissionStage, string> = {
  notice: 'Notice',
  rule: 'Rule',
  recall: 'Recall',
  speak: 'Speak',
  roleplay: 'Roleplay',
  review: 'Review',
};

export function missionStageLabel(stage: MissionStage) {
  return stageLabels[stage];
}

export function missionPathLabel(mission: Mission) {
  return missionStages
    .map((stage) => (stage === mission.stage ? `[${stageLabels[stage]}]` : stageLabels[stage]))
    .join(' -> ');
}

export function nextMissionStage(completedStages: MissionStage[]): MissionStage {
  return missionStages.find((stage) => !completedStages.includes(stage)) ?? 'review';
}

export function upsertMission(
  missions: Mission[],
  mistake: Mistake,
  assignment?: Assignment | null,
  completedStage?: MissionStage,
): Mission[] {
  const existing = missions.find((mission) => mission.mistakeId === mistake.id);
  const completedStages = completedStage === 'review'
    ? missionStages
    : Array.from(new Set([...(existing?.completedStages ?? []), ...(completedStage ? [completedStage] : [])]));
  const stage = nextMissionStage(completedStages);
  const roleplay = assignment?.roleplay ?? existing?.roleplay ?? {
    character: 'Lisa',
    scene: 'Clothing shop',
    goal: `Use: ${mistake.correct}`,
  };

  const nextMission: Mission = {
    id: existing?.id ?? `mission-${mistake.id}`,
    mistakeId: mistake.id,
    title: existing?.title ?? `Fix: ${mistake.correct}`,
    weakArea: mistake.tag,
    wrong: mistake.wrong,
    correct: mistake.correct,
    rule: mistake.rule,
    stage,
    completedStages,
    nextReview: mistake.nextReview,
    status: stage === 'review' && completedStages.includes('review') ? 'review_due' : completedStages.length > 0 ? 'in_progress' : 'weak',
    roleplay,
  };

  if (existing) {
    return missions.map((mission) => (mission.mistakeId === mistake.id ? nextMission : mission));
  }

  return [nextMission, ...missions];
}
