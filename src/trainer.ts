import { lesson } from './lesson';
import type { AppMemory } from './storage';
import type { Assignment, AssignmentSource, AssignmentType } from './types';

export type QuickAction =
  | 'revise'
  | 'quiz'
  | 'roleplay'
  | 'assignment'
  | 'harder'
  | 'repeat';

type TrainerIntent = {
  type: AssignmentType;
  title: string;
  source: AssignmentSource;
  character?: string;
  harder?: boolean;
};

function idFor(source: AssignmentSource, type: AssignmentType) {
  return `${source}-${type}-${Date.now()}`;
}

function memoryWords(memory: AppMemory) {
  return memory.weakItems.length ? memory.weakItems.slice(0, 4) : lesson.trainerDefaults.targetWords;
}

function memoryRules(memory: AppMemory) {
  return memory.rules.length ? memory.rules.slice(0, 2).map((rule) => rule.text) : lesson.trainerDefaults.targetRules;
}

function memoryMistakes(memory: AppMemory) {
  return memory.mistakes.length ? memory.mistakes.slice(0, 2).map((mistake) => mistake.wrong) : lesson.trainerDefaults.mistakeWatch;
}

function buildAssignment(intent: TrainerIntent, memory: AppMemory): Assignment {
  const targetWords = memoryWords(memory);
  const targetRules = memoryRules(memory);
  const mistakeWatch = memoryMistakes(memory);
  const roleplay = intent.type === 'roleplay'
    ? {
        character: intent.character ?? lesson.trainerDefaults.roleplay.character,
        scene: lesson.trainerDefaults.roleplay.scene,
        goal: lesson.trainerDefaults.roleplay.goal,
      }
    : undefined;

  const nextAction = intent.type === 'roleplay'
    ? `Start roleplay with ${roleplay?.character ?? 'Lisa'}`
    : intent.type === 'quiz'
      ? 'Start quiz drill'
      : 'Start practice';

  return {
    id: idFor(intent.source, intent.type),
    type: intent.type,
    title: intent.title,
    mentorMessage: intent.harder
      ? `I will make this harder: no hints first, then I will save any weak answer.`
      : `I built this from your memory. Watch the old mistake and reuse the correct sentence.`,
    targetWords,
    targetRules,
    mistakeWatch,
    nextAction,
    source: intent.source,
    roleplay,
  };
}

export function assignmentFromQuickAction(action: QuickAction, memory: AppMemory): Assignment {
  if (action === 'roleplay') {
    return buildAssignment({ type: 'roleplay', title: 'Roleplay with Lisa', source: 'quick-action', character: 'Lisa' }, memory);
  }

  if (action === 'quiz') {
    return buildAssignment({ type: 'quiz', title: 'Mila quiz: articles', source: 'quick-action' }, memory);
  }

  if (action === 'harder') {
    return buildAssignment({ type: 'quiz', title: 'Hard mode: no hints', source: 'quick-action', harder: true }, memory);
  }

  if (action === 'repeat') {
    return buildAssignment({ type: 'assignment', title: `Repeat: ${lesson.title}`, source: 'quick-action' }, memory);
  }

  if (action === 'assignment') {
    return buildAssignment({ type: 'assignment', title: "Today's Mila assignment", source: 'quick-action' }, memory);
  }

  return buildAssignment({ type: 'drill', title: 'Revise weak area', source: 'quick-action' }, memory);
}

export function assignmentFromCommand(command: string, memory: AppMemory): Assignment {
  const text = command.toLowerCase();
  const wantsRoleplay = /roleplay|lisa|store|shop|clothing/.test(text);
  const wantsQuiz = /quiz|test/.test(text);
  const wantsHarder = /harder|hard|exam/.test(text);
  const wantsAssignment = /assignment|today/.test(text);
  const wantsRepeat = /repeat|yesterday/.test(text);
  const wantsArticle = /article|der|die|das|den|dem|einen/.test(text);
  const wantsRevise = /weak|revise|review|drill/.test(text);

  if (wantsRoleplay) {
    return buildAssignment({
      type: 'roleplay',
      title: text.includes('lisa') ? 'Roleplay: Lisa in the clothing shop' : 'Roleplay: clothing shop',
      source: 'mila-command',
      character: text.includes('lisa') ? 'Lisa' : 'Lena',
    }, memory);
  }

  if (wantsQuiz || wantsHarder) {
    return buildAssignment({
      type: 'quiz',
      title: wantsHarder ? 'Harder article quiz' : 'Mila quiz',
      source: 'mila-command',
      harder: wantsHarder,
    }, memory);
  }

  if (wantsAssignment || wantsRepeat) {
    return buildAssignment({
      type: 'assignment',
      title: wantsRepeat ? `Repeat: ${lesson.title}` : "Today's Mila assignment",
      source: 'mila-command',
    }, memory);
  }

  if (wantsArticle || wantsRevise) {
    return buildAssignment({
      type: 'drill',
      title: wantsArticle ? 'Article repair drill' : 'Revise weak area',
      source: 'mila-command',
    }, memory);
  }

  return buildAssignment({ type: 'assignment', title: "Mila's local assignment", source: 'mila-command' }, memory);
}
