import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mistake } from './lesson';
import type { Assignment, Mission } from './types';

const STORAGE_KEY = 'german-mentor-memory-v1';

export type NotebookEntry = {
  id: string;
  german: string;
  english: string;
  reviewDue?: string;
  source?: string;
};

export type RuleEntry = {
  id: string;
  text: string;
  reviewDue?: string;
  source?: string;
};

export type AppMemory = {
  onboarded: boolean;
  completedSessions: number;
  weakItems: string[];
  mistakes: Mistake[];
  assignments: Assignment[];
  activeAssignment: Assignment | null;
  missions: Mission[];
  words: NotebookEntry[];
  sentences: NotebookEntry[];
  rules: RuleEntry[];
  reviewDue: string[];
  loopProgress: string[];
  lastMentorNote?: string;
};

export const defaultMemory: AppMemory = {
  onboarded: false,
  completedSessions: 0,
  weakItems: [],
  mistakes: [],
  assignments: [],
  activeAssignment: null,
  missions: [],
  words: [],
  sentences: [],
  rules: [],
  reviewDue: [],
  loopProgress: [],
};

export async function loadMemory(): Promise<AppMemory> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultMemory;

  try {
    const parsed = JSON.parse(raw) as Partial<AppMemory>;
    return {
      ...defaultMemory,
      ...parsed,
      weakItems: parsed.weakItems ?? defaultMemory.weakItems,
      mistakes: parsed.mistakes ?? defaultMemory.mistakes,
      assignments: parsed.assignments ?? defaultMemory.assignments,
      activeAssignment: parsed.activeAssignment ?? defaultMemory.activeAssignment,
      missions: parsed.missions ?? defaultMemory.missions,
      words: parsed.words ?? defaultMemory.words,
      sentences: parsed.sentences ?? defaultMemory.sentences,
      rules: parsed.rules ?? defaultMemory.rules,
      reviewDue: parsed.reviewDue ?? defaultMemory.reviewDue,
      loopProgress: parsed.loopProgress ?? defaultMemory.loopProgress,
    };
  } catch {
    return defaultMemory;
  }
}

export async function saveMemory(memory: AppMemory): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}
