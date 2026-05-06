import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { lesson, Mistake } from './src/lesson';
import { missionPathLabel, missionStageLabel, upsertMission } from './src/missions';
import { AppMemory, defaultMemory, loadMemory, NotebookEntry, RuleEntry, saveMemory } from './src/storage';
import { assignmentFromCommand, assignmentFromQuickAction, QuickAction } from './src/trainer';
import type { Assignment, MissionStage } from './src/types';

import Card from './src/components/Card';
import Pill from './src/components/Pill';
import PrimaryButton from './src/components/PrimaryButton';
import SecondaryButton from './src/components/SecondaryButton';
import ProgressBar from './src/components/ProgressBar';
import ChatBubble from './src/components/ChatBubble';
import Mascot, { MascotState } from './src/components/Mascot';
import ScreenFrame from './src/components/ScreenFrame';
import MilaHeader from './src/components/MilaHeader';
import NotebookSection from './src/components/NotebookSection';
import { colors, typography, spacing } from './src/components/theme';

(Text as any).defaultProps = { ...(Text as any).defaultProps, maxFontSizeMultiplier: 1.1 };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, maxFontSizeMultiplier: 1.1 };

type Screen = 'onboarding' | 'today' | 'mission' | 'practice' | 'speaking' | 'roleplay' | 'mistakes' | 'note' | 'notebook';

const lenaStoreAssistant = require('./assets/mila/lena-store-assistant.png');

const lessonWords = lesson.notebook.words;
const lessonSentences = lesson.notebook.sentences;
const lessonRules = lesson.notebook.rules;

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function sourceLabel(source?: Assignment['source']) {
  if (source === 'mila-command') return 'Mila command';
  if (source === 'quick-action') return 'Mila mission';
  if (source === 'mistake-mission') return 'Mistake mission';
  return 'Mila mission';
}

function mergeMistakes(mistakes: Mistake[], mistake: Mistake): Mistake[] {
  const existing = mistakes.find((item) => item.id === mistake.id);
  if (!existing) return [mistake, ...mistakes];

  const nextMistake = {
    ...existing,
    ...mistake,
    timesWrong: Math.max(existing.timesWrong + 1, mistake.timesWrong),
  };

  return mistakes.map((item) => (item.id === mistake.id ? nextMistake : item));
}

function missionStageForLoopStep(step: string): MissionStage | undefined {
  if (step === 'notice') return 'notice';
  if (step === 'rule') return 'rule';
  if (step === 'recall') return 'recall';
  if (step === 'speak') return 'speak';
  if (step === 'roleplay') return 'roleplay';
  if (step === 'review') return 'review';
  return undefined;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [memory, setMemory] = useState<AppMemory>(defaultMemory);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadMemory().then((stored) => {
      if (!mounted) return;
      setMemory(stored);
      setScreen(stored.onboarded ? 'today' : 'onboarding');
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function updateMemory(next: AppMemory) {
    setMemory(next);
    await saveMemory(next);
  }

  function buildLoopMemory(step: string, mistake?: Mistake) {
    const assignmentSource = sourceLabel(memory.activeAssignment?.source);
    const wordsWithSource = lessonWords.map((item) => ({ ...item, source: assignmentSource }));
    const sentencesWithSource = lessonSentences.map((item) => ({ ...item, source: assignmentSource }));
    const rulesWithSource = lessonRules.map((item) => ({ ...item, source: assignmentSource }));
    const nextMistakes = mistake ? mergeMistakes(memory.mistakes, mistake) : memory.mistakes;
    const nextWeakItems = Array.from(new Set([...lesson.roleplay.todayWords, ...memory.weakItems]));
    const nextReviewDue = Array.from(new Set([lesson.savedMistake.correct, lesson.savedMistake.rule, ...memory.reviewDue]));
    const completedMissionStage = missionStageForLoopStep(step);
    const nextMissions = mistake
      ? upsertMission(memory.missions, mistake, memory.activeAssignment, completedMissionStage)
      : memory.missions;

    return {
      ...memory,
      onboarded: true,
      weakItems: nextWeakItems,
      mistakes: nextMistakes,
      missions: nextMissions,
      words: uniqueById([...wordsWithSource, ...memory.words]),
      sentences: uniqueById([...sentencesWithSource, ...memory.sentences]),
      rules: uniqueById([...rulesWithSource, ...memory.rules]),
      reviewDue: nextReviewDue,
      loopProgress: Array.from(new Set([...memory.loopProgress, step])),
    };
  }

  async function saveLoopStep(step: string, mistake?: Mistake) {
    await updateMemory(buildLoopMemory(step, mistake));
  }

  async function completeOnboarding() {
    await updateMemory({ ...memory, onboarded: true });
    setScreen('today');
  }

  async function createAssignment(assignment: Assignment) {
    await updateMemory({
      ...memory,
      onboarded: true,
      activeAssignment: assignment,
      assignments: uniqueById([assignment, ...memory.assignments]).slice(0, 8),
    });
  }

  async function handleQuickAction(action: QuickAction) {
    await createAssignment(assignmentFromQuickAction(action, memory));
  }

  async function handleCommand(command: string) {
    await createAssignment(assignmentFromCommand(command, memory));
  }

  function startActiveAssignment() {
    if (memory.activeAssignment?.type === 'roleplay') {
      setScreen('mission');
      return;
    }

    setScreen('mission');
  }

  async function finishSession(step: string = 'review') {
    await updateMemory({
      ...buildLoopMemory(step, lesson.savedMistake),
      completedSessions: memory.completedSessions + 1,
      lastMentorNote: lesson.mentorNote.encouragement,
    });
    setScreen('notebook');
  }

  function handleTabPress(tab: string) {
    if (tab === 'Today') setScreen('today');
    if (tab === 'Practice') setScreen('mission');
    if (tab === 'Roleplay') setScreen('roleplay');
    if (tab === 'Notebook') setScreen('notebook');
  }

  if (!ready) {
    return (
      <AppShell>
        <View style={[styles.screen, styles.centered]}>
          <Mascot state="idle" size={86} />
          <Text style={styles.loadingTitle}>Loading your mentor...</Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {screen === 'onboarding' && <OnboardingScreen onContinue={completeOnboarding} />}
      {screen === 'today' && (
        <TodayScreen
          memory={memory}
          onStart={() => setScreen('mission')}
          onTabPress={handleTabPress}
        />
      )}
      {screen === 'mission' && (
        <MissionFlowScreen
          assignment={memory.activeAssignment}
          onTabPress={handleTabPress}
          onFinish={() => {
            void finishSession('review');
          }}
        />
      )}
      {screen === 'practice' && (
        <PracticeScreen
          assignment={memory.activeAssignment}
          onTabPress={handleTabPress}
          onMistake={async () => {
            await saveLoopStep('practice', lesson.savedMistake);
          }}
          onContinue={async () => {
            await saveLoopStep('practice', lesson.savedMistake);
            setScreen('speaking');
          }}
        />
      )}
      {screen === 'speaking' && (
        <SpeakingScreen
          onContinue={async () => {
            await saveLoopStep('speaking', lesson.savedMistake);
            setScreen('roleplay');
          }}
        />
      )}
      {screen === 'roleplay' && (
        <RoleplayScreen
          assignment={memory.activeAssignment}
          onTabPress={handleTabPress}
          onEnd={async () => {
            await saveLoopStep('roleplay', lesson.savedMistake);
            setScreen('mistakes');
          }}
        />
      )}
      {screen === 'mistakes' && <MistakesScreen memory={memory} onContinue={() => setScreen('note')} onTabPress={handleTabPress} />}
      {screen === 'note' && <MentorNoteScreen onFinish={finishSession} />}
      {screen === 'notebook' && <NotebookScreen memory={memory} onTabPress={handleTabPress} />}
    </AppShell>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.safe}>
      <StatusBar style="dark" />
      {children}
    </View>
  );
}

function OnboardingScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <ScreenFrame>
      <Mascot state="idle" size={96} centered />
      <Text style={typography.heroTitle}>Your German mentor</Text>
      <Text style={typography.lede}>Short A1.1 missions for speaking, roleplay, and mistake review.</Text>

      <View style={styles.setupStack}>
        <Pill label="Goal: everyday German" />
        <Pill label="Level: A1.1" tone="warm" />
        <Pill label="Daily: 5 minutes" />
      </View>

      <Card style={styles.questionCard}>
        <Text style={typography.cardTitle}>Start calmly.</Text>
        <Text style={typography.muted}>Today you practice a real situation: in a clothing shop.</Text>
      </Card>

      <PrimaryButton label="Start my first mission" onPress={onContinue} />
    </ScreenFrame>
  );
}

function TodayScreen({
  memory,
  onStart,
  onTabPress,
}: {
  memory: AppMemory;
  onStart: () => void;
  onTabPress: (tab: string) => void;
}) {
  return (
    <ScreenFrame activeTab="Today" onTabPress={onTabPress}>
      {/* Header: greeting left, small Mila right */}
      <View style={styles.todayHeader}>
        <View style={styles.flex}>
          <Text style={styles.todayGreeting}>Guten Morgen! 👋</Text>
          <Text style={styles.todaySubGreeting}>Mila has one mission ready for you.</Text>
        </View>
        <Mascot state="idle" size={48} />
      </View>

      {/* Section eyebrow */}
      <Text style={styles.sectionEyebrow}>Today's mission</Text>

      {/* Hero mission card */}
      <Card style={styles.heroMissionCard}>
        <Text style={styles.missionCategory}>Clothing shop</Text>
        <Text style={styles.missionGerman}>Ich suche einen Pullover in Größe M.</Text>
        <Text style={styles.missionEnglish}>I am looking for a sweater in size M.</Text>

        <View style={styles.missionProgressRow}>
          <View style={styles.progressCompact}>
            <ProgressBar active={0} />
          </View>
          <Text style={styles.missionProgressText}>0 of 6 steps</Text>
        </View>

        <View style={styles.rowWrap}>
          <Pill label="der Pullover" />
          <Pill label="einen Pullover" tone="warm" />
          <Pill label="Größe M" />
        </View>

        <PrimaryButton label="Start mission" onPress={onStart} />
      </Card>

      {/* Compact review preview */}
      <Card style={styles.reviewPreview}>
        <Text style={typography.cardTitle}>Coming up for review</Text>
        {lesson.notebook.words.slice(0, 2).map((word) => (
          <View key={word.id} style={styles.reviewRow}>
            <Text style={[typography.germanText, styles.reviewItemText]}>{word.german}</Text>
            <Text style={[typography.reviewText, styles.reviewDueText]}>{word.reviewDue}</Text>
          </View>
        ))}
        {lesson.notebook.rules.slice(0, 1).map((rule) => (
          <View key={rule.id} style={styles.reviewRow}>
            <Text style={[typography.germanText, styles.reviewItemText]}>{rule.text}</Text>
            <Text style={[typography.reviewText, styles.reviewDueText]}>{rule.reviewDue}</Text>
          </View>
        ))}
      </Card>
    </ScreenFrame>
  );
}

const missionSteps = ['Notice', 'Rule', 'Recall', 'Speak', 'Roleplay', 'Review'];
const roleplaySceneChips = [
  { label: 'Clothing shop', active: true },
  { label: 'Cafe', active: false },
  { label: 'Train station', active: false },
];
const voiceActions = ['Listen', 'Speak', 'Repeat', 'Use text'] as const;
type VoiceAction = (typeof voiceActions)[number];

function VoiceControls({
  active,
  onAction,
}: {
  active: VoiceAction;
  onAction: (action: VoiceAction) => void;
}) {
  return (
    <View style={styles.voiceControlRow}>
      {voiceActions.map((action) => (
        <Pressable
          key={action}
          onPress={() => onAction(action)}
          style={[styles.voiceControlButton, active === action && styles.voiceControlButtonActive]}
        >
          <Text style={[styles.voiceControlText, active === action && styles.voiceControlTextActive]}>{action}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MilaTrainerPanel({ replied }: { replied: boolean }) {
  return (
    <Card style={styles.trainerPanel}>
      <View style={styles.trainerHeaderRow}>
        <Mascot state={replied ? 'correcting' : 'encouraging'} size={42} />
        <View style={styles.flex}>
          <Text style={typography.cardTitle}>Mila trainer</Text>
          <Text style={typography.muted}>{replied ? 'Good. You used einen Pullover, not eine Pullover.' : 'Use this with Lisa now.'}</Text>
        </View>
      </View>
      <View style={styles.trainerGrid}>
        <View style={styles.trainerItem}>
          <Text style={typography.caption}>Meaning</Text>
          <Text style={styles.trainerItemText}>der Pullover = the sweater</Text>
        </View>
        <View style={styles.trainerItem}>
          <Text style={typography.caption}>Pronunciation</Text>
          <Text style={styles.trainerItemText}>Pullover = pull-oh-ver</Text>
        </View>
        <View style={styles.trainerItem}>
          <Text style={typography.caption}>Usage</Text>
          <Text style={styles.trainerItemText}>Ich suche einen Pullover.</Text>
        </View>
        <View style={styles.trainerItem}>
          <Text style={typography.caption}>Repair</Text>
          <Text style={styles.trainerItemText}>Not eine Pullover. Say einen Pullover.</Text>
        </View>
      </View>
    </Card>
  );
}

function RoleplayScene({
  character,
  scene,
  goal,
  replied,
  voiceAction,
  onVoiceAction,
}: {
  character: string;
  scene: string;
  goal: string;
  replied: boolean;
  voiceAction: VoiceAction;
  onVoiceAction: (action: VoiceAction) => void;
}) {
  const visibleTurns = lesson.roleplay.turns.slice(0, replied ? lesson.roleplay.turns.length : 1);

  return (
    <>
      <Card style={styles.roleplaySceneSurface}>
        <View style={styles.roleplaySceneHeader}>
          <StoreAssistant size={72} />
          <View style={styles.flex}>
            <Text style={typography.caption}>{scene}</Text>
            <Text style={typography.cardTitle}>{character}</Text>
            <Text style={typography.englishGuide}>Goal: {goal}</Text>
          </View>
        </View>

        <View style={styles.sceneChipRow}>
          {roleplaySceneChips.map((chip) => (
            <View key={chip.label} style={[styles.sceneChip, chip.active ? styles.sceneChipActive : styles.sceneChipDisabled]}>
              <Text style={[styles.sceneChipText, chip.active ? styles.sceneChipTextActive : styles.sceneChipTextDisabled]}>
                {chip.active ? chip.label : `${chip.label} soon`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.conversationArea}>
          {visibleTurns.map((turn, index) => (
            <ChatBubble key={`${turn.speaker}-${index}`} side={turn.speaker === 'learner' ? 'right' : 'left'} text={turn.text} />
          ))}
          {!replied ? (
            <View style={styles.replyPromptInline}>
              <Text style={typography.caption}>Your line</Text>
              <Text style={styles.replyText}>Speak or type: Ich suche einen Pullover in Größe M.</Text>
            </View>
          ) : null}
        </View>

        <VoiceControls active={voiceAction} onAction={onVoiceAction} />
      </Card>
      <MilaTrainerPanel replied={replied} />
    </>
  );
}

function MissionFlowScreen({
  assignment,
  onFinish,
  onTabPress,
}: {
  assignment: Assignment | null;
  onFinish: () => void;
  onTabPress: (tab: string) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [roleplayReplied, setRoleplayReplied] = useState(false);
  const [voiceAction, setVoiceAction] = useState<VoiceAction>('Listen');
  const step = missionSteps[stepIndex];
  const recallCorrect = normalizeAnswer(answer) === normalizeAnswer('einen Pullover');
  const targetSentence = lesson.speakingTask.target;
  const targetRule = assignment?.targetRules[0] ?? lesson.savedMistake.rule;

  function nextStep() {
    if (step === 'Recall' && !checked) {
      setChecked(true);
      return;
    }

    if (step === 'Roleplay' && !roleplayReplied) {
      setRoleplayReplied(true);
      return;
    }

    if (stepIndex < missionSteps.length - 1) {
      setStepIndex(stepIndex + 1);
      setAnswer('');
      setChecked(false);
      return;
    }

    onFinish();
  }

  return (
    <ScreenFrame activeTab="Practice" onTabPress={onTabPress}>
      <MilaHeader
        title={step}
        subtitle="Clothing shop: ask for a sweater in size M"
        state={step === 'Review' ? 'reviewing' : 'encouraging'}
      />

      <View style={styles.stepTimeline}>
        {missionSteps.map((item, index) => (
          <View key={item} style={styles.stepTimelineItem}>
            <View style={[styles.stepTimelineDot, index === stepIndex && styles.stepTimelineDotActive]} />
            <Text style={[styles.stepTimelineLabel, index === stepIndex && styles.stepTimelineLabelActive]}>{item}</Text>
            {index < missionSteps.length - 1 && (
              <View style={[styles.stepTimelineLine, index < stepIndex && styles.stepTimelineLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ProgressBar active={Math.min(stepIndex + 1, 4)} />

      {step === 'Notice' ? (
        <Card style={styles.promptCard}>
          <Text style={typography.caption}>Mila says</Text>
          <Text style={typography.promptStrong}>Ich suche einen Pullover in Größe M.</Text>
          <Text style={typography.englishGuide}>English help: I am looking for a sweater in size M.</Text>
          <View style={styles.rowWrap}>
            <Pill label="der Pullover" />
            <Pill label="einen Pullover" tone="warm" />
          </View>
        </Card>
      ) : null}

      {step === 'Rule' ? (
        <Card>
          <Text style={typography.caption}>Tiny rule</Text>
          <Text style={typography.cardTitle}>After suchen, der Pullover changes to einen Pullover.</Text>
          <Text style={typography.ruleText}>{targetRule}</Text>
          <Text style={typography.englishGuide}>English help: after suchen, der Pullover becomes einen Pullover.</Text>
          <Text style={typography.correctionText}>Watch: do not say eine Pullover.</Text>
        </Card>
      ) : null}

      {step === 'Recall' ? (
        <Card style={styles.recallCard}>
          <Text style={typography.caption}>Active recall</Text>
          <Text style={typography.promptStrong}>Ich suche ____ ____ in Größe M.</Text>
          <TextInput
            value={answer}
            onChangeText={(value) => {
              setAnswer(value);
              setChecked(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="einen Pullover"
            placeholderTextColor="#9c958a"
            style={styles.answerInput}
          />
          {checked ? (
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>einen Pullover</Text>
              <Text style={recallCorrect ? typography.correctText : typography.correctionText}>
                {recallCorrect ? 'Correct. Now use the whole sentence.' : 'Almost. Mila saves this weak spot for later review.'}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {step === 'Speak' ? (
        <Card>
          <Text style={typography.caption}>Speak once</Text>
          <Text style={typography.promptStrong}>{targetSentence}</Text>
          <Text style={typography.englishGuide}>English help: say the full shop sentence out loud.</Text>
          <View style={styles.recordArea}>
            <Pressable style={styles.recordButton} onPress={() => setChecked((prev) => !prev)}>
              <Text style={styles.recordText}>SPEAK</Text>
            </Pressable>
          </View>
          {checked ? (
            <View style={styles.speakPracticeBox}>
              <Text style={typography.correctText}>Saved. Mila will reuse this sentence in the roleplay.</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {step === 'Roleplay' ? (
        <RoleplayScene
          character={lesson.roleplay.character}
          scene={lesson.roleplay.scenario}
          goal={lesson.roleplay.learnerGoal}
          replied={roleplayReplied}
          voiceAction={voiceAction}
          onVoiceAction={(action) => {
            setVoiceAction(action);
            if (action === 'Speak') setRoleplayReplied(true);
          }}
        />
      ) : null}

      {step === 'Review' ? (
        <Card style={styles.summaryCard}>
          <Text style={typography.successLabel}>Saved to Notebook</Text>
          <Text style={typography.cardTitle}>Weak word: der Pullover</Text>
          <Text style={typography.cardTitle}>Rule: {targetRule}</Text>
          <Text style={typography.wrongSmall}>{lesson.savedMistake.wrong}</Text>
          <Text style={typography.rightSmall}>{lesson.savedMistake.correct}</Text>
          <Text style={typography.reviewText}>Next review: {lesson.savedMistake.nextReview}</Text>
        </Card>
      ) : null}

      <View style={styles.splitActions}>
        <SecondaryButton label={step === 'Review' ? 'Again' : 'Mila hint'} onPress={() => setChecked(true)} />
        <PrimaryButton
          label={
            step === 'Review'
              ? 'Save to Notebook'
              : step === 'Recall' && !checked
                ? 'Check answer'
                : step === 'Roleplay' && !roleplayReplied
                  ? 'Reply to Lisa'
                  : 'Continue'
          }
          onPress={nextStep}
          compact
        />
      </View>
    </ScreenFrame>
  );
}

function PracticeScreen({
  assignment,
  onMistake,
  onContinue,
  onTabPress,
}: {
  assignment: Assignment | null;
  onMistake: () => void;
  onContinue: () => void;
  onTabPress: (tab: string) => void;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const card = lesson.practiceCards[cardIndex];
  const isSpeakCard = card.mode === 'speak';
  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(card.answer);
  const assignmentRule = assignment?.targetRules[0];

  function moveNext() {
    if (cardIndex < lesson.practiceCards.length - 1) {
      setCardIndex(cardIndex + 1);
      setAnswer('');
      setChecked(false);
      return;
    }

    onContinue();
  }

  function revealAnswer() {
    setChecked(true);
    if (!isSpeakCard && !isCorrect) {
      onMistake();
    }
  }

  return (
    <ScreenFrame activeTab="Practice" onTabPress={onTabPress}>
      <ProgressBar active={1} />
      <Text style={typography.screenTitle}>Active recall</Text>
      <Text style={typography.lede}>Answer first. Mila shows the correction only after you try.</Text>

      {assignment ? (
        <Card style={styles.assignmentMiniCard}>
          <Text style={typography.successLabel}>{sourceLabel(assignment.source)}</Text>
          <Text style={typography.cardTitle}>{assignment.title}</Text>
          <Text style={typography.muted}>Mila is watching: {assignment.mistakeWatch.join(', ')}</Text>
        </Card>
      ) : null}

      <Card style={styles.recallCard}>
        <View style={styles.cardTopRow}>
          <Pill label={isSpeakCard ? 'Speak card' : 'Type card'} tone="warm" />
          <Text style={typography.caption}>{cardIndex + 1}/{lesson.practiceCards.length}</Text>
        </View>
        <Text style={styles.promptText}>{card.prompt}</Text>
        <Text style={typography.englishGuide}>{assignmentRule ? `Mila rule: ${assignmentRule}` : card.englishGuide}</Text>

        {isSpeakCard ? (
          <View style={styles.speakPracticeBox}>
            <Mascot state={checked ? 'celebrating' : 'listening'} size={66} />
            <Text style={typography.targetLine}>{checked ? card.answer : 'Say it before you reveal it.'}</Text>
          </View>
        ) : (
          <TextInput
            value={answer}
            onChangeText={(value) => {
              setAnswer(value);
              setChecked(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Type in German"
            placeholderTextColor="#9c958a"
            style={styles.answerInput}
          />
        )}

        {checked ? (
          <View style={styles.answerBox}>
            <Text style={styles.answerText}>{card.answer}</Text>
            <Text style={isCorrect || isSpeakCard ? typography.correctText : typography.correctionText}>
              {isCorrect || isSpeakCard ? card.feedback : `Close. Mila saved this weak item and opened a mission: ${card.weakItem}.`}
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.splitActions}>
        <SecondaryButton
          label={checked ? 'Again' : isSpeakCard ? 'I said it' : 'Check'}
          onPress={() => {
            if (checked) {
              setAnswer('');
              setChecked(false);
              return;
            }
            setChecked(true);
            if (!isSpeakCard && !isCorrect) {
              onMistake();
            }
          }}
          dark={!checked}
        />
        <PrimaryButton label={cardIndex === lesson.practiceCards.length - 1 ? 'Go speak' : 'Next'} onPress={checked ? moveNext : revealAnswer} compact />
      </View>
    </ScreenFrame>
  );
}

function SpeakingScreen({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState<'listen' | 'speak' | 'feedback'>('listen');
  const mascotState: MascotState = phase === 'listen' ? 'idle' : phase === 'speak' ? 'listening' : 'correcting';

  return (
    <ScreenFrame>
      <ProgressBar active={2} />
      <Text style={typography.screenTitle}>Speak</Text>
      <Text style={typography.lede}>{lesson.speakingTask.prompt}</Text>

      <Card style={styles.promptCard}>
        <Text style={typography.caption}>{phase === 'listen' ? 'Listen' : phase === 'speak' ? 'Speak' : 'Repair'}</Text>
        <Text style={typography.promptStrong}>{lesson.speakingTask.starter}</Text>
        <Text style={typography.englishGuide}>
          {phase === 'listen' ? lesson.speakingTask.listenCue : `English guide: ${lesson.speakingTask.englishGuide}`}
        </Text>
      </Card>

      <View style={styles.recordArea}>
        <Pressable
          style={[styles.recordButton, phase === 'feedback' && styles.recordButtonDone]}
          onPress={() => setPhase(phase === 'listen' ? 'speak' : 'feedback')}
        >
          <Text style={styles.recordText}>{phase === 'listen' ? 'HÖREN' : phase === 'speak' ? 'SPRICH' : 'OK'}</Text>
        </Pressable>
        <Mascot state={mascotState} size={70} />
      </View>

      {phase === 'feedback' ? (
        <Card>
          <Text style={typography.caption}>Heard</Text>
          <Text style={typography.cardTitle}>{lesson.speakingTask.transcript}</Text>
          <Text style={typography.targetLine}>German target: {lesson.speakingTask.target}</Text>
          <Text style={typography.correctionText}>{lesson.speakingTask.correction}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={typography.caption}>Mila</Text>
          <Text style={typography.cardTitle}>{phase === 'listen' ? lesson.speakingTask.target : lesson.speakingTask.retryPrompt}</Text>
          <Text style={typography.muted}>This MVP simulates listening locally. Your correction is still saved to review.</Text>
        </Card>
      )}

      <View style={styles.splitActions}>
        <SecondaryButton label="Retry" onPress={() => setPhase('speak')} dark />
        <PrimaryButton label={phase === 'feedback' ? 'Save & continue' : 'Show feedback'} onPress={phase === 'feedback' ? onContinue : () => setPhase('feedback')} compact />
      </View>
    </ScreenFrame>
  );
}

function RoleplayScreen({
  assignment,
  onEnd,
  onTabPress,
}: {
  assignment: Assignment | null;
  onEnd: () => void;
  onTabPress: (tab: string) => void;
}) {
  const [replied, setReplied] = useState(false);
  const [voiceAction, setVoiceAction] = useState<VoiceAction>('Listen');
  const roleplay = assignment?.roleplay;
  const character = roleplay?.character ?? lesson.roleplay.character;
  const scene = roleplay?.scene ?? lesson.roleplay.scenario;
  const goal = roleplay?.goal ?? lesson.roleplay.learnerGoal;

  return (
    <ScreenFrame activeTab="Roleplay" onTabPress={onTabPress}>
      <MilaHeader title="Roleplay" subtitle={scene} state="idle" />

      <RoleplayScene
        character={character}
        scene={scene}
        goal={goal}
        replied={replied}
        voiceAction={voiceAction}
        onVoiceAction={(action) => {
          setVoiceAction(action);
          if (action === 'Speak') setReplied(true);
        }}
      />

      <View style={styles.splitActions}>
        <SecondaryButton label="Use text" onPress={() => setVoiceAction('Use text')} />
        <PrimaryButton label={replied ? 'End roleplay' : 'Send reply'} onPress={replied ? onEnd : () => setReplied(true)} compact />
      </View>
    </ScreenFrame>
  );
}

function MistakesScreen({
  memory,
  onContinue,
  onTabPress,
}: {
  memory: AppMemory;
  onContinue: () => void;
  onTabPress: (tab: string) => void;
}) {
  const mistakes = memory.mistakes.length ? memory.mistakes : [lesson.savedMistake];
  const [reviewed, setReviewed] = useState(false);

  return (
    <ScreenFrame activeTab="Notebook" onTabPress={onTabPress}>
      <MilaHeader title="Mistakes" subtitle="Your personal trainer" state="correcting" />

      {mistakes.map((mistake) => (
        <Card key={mistake.id} style={styles.mistakeCard}>
          <Text style={typography.dangerLabel}>{mistake.tag}</Text>
          <Text style={typography.wrongText}>{mistake.wrong}</Text>
          <Text style={typography.rightText}>{mistake.correct}</Text>
          <Text style={typography.muted}>{mistake.rule}</Text>
          <View style={styles.rowWrap}>
            <Pill label={`${mistake.timesWrong} times wrong`} tone="danger" />
            <Pill label={`Review ${mistake.nextReview.toLowerCase()}`} tone="warm" />
          </View>
          {memory.missions.find((mission) => mission.mistakeId === mistake.id) ? (
            <Text style={typography.targetLine}>
              Mission: {missionPathLabel(memory.missions.find((mission) => mission.mistakeId === mistake.id)!)}
            </Text>
          ) : null}
          {reviewed ? (
            <Text style={typography.correctText}>Fixed once now. Mila will bring it back tomorrow.</Text>
          ) : null}
        </Card>
      ))}

      <View style={styles.replyBox}>
        <Text style={typography.caption}>Quick repair</Text>
        <Text style={styles.replyText}>{reviewed ? lesson.savedMistake.correct : 'Say the corrected sentence before continuing.'}</Text>
      </View>

      <View style={styles.splitActions}>
        <SecondaryButton label="Mark fixed" onPress={() => setReviewed(true)} dark />
        <PrimaryButton label="Mentor note" onPress={onContinue} compact />
      </View>
    </ScreenFrame>
  );
}

function NotebookScreen({ memory, onTabPress }: { memory: AppMemory; onTabPress: (tab: string) => void }) {
  const hasMistake = memory.mistakes.length > 0;
  const finishedSession = memory.completedSessions > 0;
  const words: NotebookEntry[] = memory.words.length ? memory.words : lesson.notebook.words;
  const sentences: NotebookEntry[] = memory.sentences.length ? memory.sentences : lesson.notebook.sentences;
  const rules: RuleEntry[] = memory.rules.length ? memory.rules : lesson.notebook.rules;
  const mistakes = memory.mistakes.length ? memory.mistakes : [lesson.savedMistake];
  const reviewDueItems = [
    ...memory.reviewDue.map((item, index) => ({ id: `review-${index}`, title: item, detail: 'Review due' })),
    ...mistakes.map((mistake) => ({ id: `mistake-${mistake.id}`, title: mistake.correct, detail: `Mistake repair · ${mistake.nextReview}` })),
    ...words.slice(0, 2).map((word) => ({ id: `word-${word.id}`, title: word.german, detail: word.reviewDue ?? 'Review soon' })),
  ].slice(0, 3);
  const weakSpotItems = [
    ...memory.weakItems.map((item, index) => ({ id: `weak-${index}`, title: item, detail: 'Weak word' })),
    ...mistakes.map((mistake) => ({ id: `weak-mistake-${mistake.id}`, title: mistake.wrong, detail: `Say: ${mistake.correct}` })),
  ].slice(0, 4);
  const checklistStatus = [
    memory.loopProgress.includes('practice') || finishedSession,
    memory.loopProgress.includes('speaking') || finishedSession,
    hasMistake,
    memory.loopProgress.includes('roleplay') || finishedSession,
  ];

  return (
    <ScreenFrame activeTab="Notebook" onTabPress={onTabPress}>
      <MilaHeader title="Review Notebook" subtitle="Mila keeps today small: review, repair, then move on." state="reviewing" />

      <Card style={styles.notebookHero}>
        <View style={styles.flex}>
          <Text style={typography.cardTitle}>Next tiny review</Text>
          <Text style={typography.muted}>
            {memory.reviewDue.length
              ? memory.reviewDue.slice(0, 2).join(' · ')
              : hasMistake
                ? 'Tomorrow: practice einen Pullover again.'
                : 'Nothing urgent yet. Finish a session to unlock review.'}
          </Text>
        </View>
        <Mascot state="reviewing" size={54} />
      </Card>

      <NotebookSection title="Review due" accent="sage">
        {reviewDueItems.map((item) => (
          <View key={item.id} style={styles.dashboardRow}>
            <Text style={typography.germanText}>{item.title}</Text>
            <Text style={typography.reviewText}>{item.detail}</Text>
          </View>
        ))}
      </NotebookSection>

      <NotebookSection title="Weak spots" accent="coral">
        {weakSpotItems.map((item) => (
          <View key={item.id} style={styles.dashboardRow}>
            <Text style={item.title.includes('eine') ? typography.wrongSmall : typography.germanText}>{item.title}</Text>
            <Text style={typography.reviewText}>{item.detail}</Text>
          </View>
        ))}
      </NotebookSection>

      {memory.missions.length ? (
        <NotebookSection title="Mila missions" accent="amber">
          {memory.missions.map((mission) => (
            <View key={mission.id} style={styles.notebookRow}>
              <Text style={typography.germanText}>{mission.title}</Text>
              <Text style={typography.englishText}>{missionPathLabel(mission)}</Text>
              <Text style={typography.reviewText}>Now: {missionStageLabel(mission.stage)} · Review: {mission.nextReview}</Text>
            </View>
          ))}
        </NotebookSection>
      ) : null}

      {memory.activeAssignment ? (
        <NotebookSection title="Latest Mila assignment" accent="gold">
          <Text style={typography.germanText}>{memory.activeAssignment.title}</Text>
          <Text style={typography.englishText}>Source: {sourceLabel(memory.activeAssignment.source)}</Text>
          <Text style={typography.reviewText}>{memory.activeAssignment.nextAction}</Text>
        </NotebookSection>
      ) : null}

      <NotebookSection title="Today you practiced" accent="sage">
        {lesson.notebook.checklist.map((item, index) => (
          <View key={item.label} style={styles.checkRow}>
            <Text style={[styles.checkBox, checklistStatus[index] && styles.checkBoxDone]}>{checklistStatus[index] ? '●' : '○'}</Text>
            <Text style={styles.checkText}>{item.label}</Text>
          </View>
        ))}
      </NotebookSection>

      <NotebookSection title="Learned words" accent="sage">
        {words.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.notebookRow}>
            <Text style={typography.germanText}>{item.german}</Text>
            <Text style={typography.englishText}>{item.english}</Text>
            {item.source ? <Text style={typography.reviewText}>Source: {item.source}</Text> : null}
            {item.reviewDue ? <Text style={typography.reviewText}>Review: {item.reviewDue}</Text> : null}
          </View>
        ))}
      </NotebookSection>

      <NotebookSection title="Learned sentences" accent="gold">
        {sentences.slice(0, 2).map((item) => (
          <View key={item.id} style={styles.notebookRow}>
            <Text style={typography.germanText}>{item.german}</Text>
            <Text style={typography.englishText}>{item.english}</Text>
            {item.source ? <Text style={typography.reviewText}>Source: {item.source}</Text> : null}
            {item.reviewDue ? <Text style={typography.reviewText}>Review: {item.reviewDue}</Text> : null}
          </View>
        ))}
      </NotebookSection>

      <NotebookSection title="Learned rules" accent="amber">
        {rules.slice(0, 2).map((rule) => (
          <View key={rule.id} style={styles.notebookRow}>
            <Text style={typography.ruleText}>{rule.text}</Text>
            {rule.source ? <Text style={typography.reviewText}>Source: {rule.source}</Text> : null}
            {rule.reviewDue ? <Text style={typography.reviewText}>Review: {rule.reviewDue}</Text> : null}
          </View>
        ))}
      </NotebookSection>

      <NotebookSection title="Mastered" accent="sage">
        <Text style={typography.muted}>Nothing mastered yet. Mila will move easy items here after future reviews.</Text>
      </NotebookSection>

      <NotebookSection title="Mistakes fixed" accent="coral">
        {mistakes.slice(0, 2).map((mistake) => (
          <View key={mistake.id} style={styles.notebookRow}>
            <Text style={typography.wrongSmall}>{mistake.wrong}</Text>
            <Text style={typography.rightSmall}>{mistake.correct}</Text>
            <Text style={typography.englishText}>{mistake.rule}</Text>
            <Text style={typography.reviewText}>Source: Mistake mission · Review: {mistake.nextReview}</Text>
          </View>
        ))}
      </NotebookSection>
    </ScreenFrame>
  );
}

function MentorNoteScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <ScreenFrame>
      <Mascot state="celebrating" size={120} centered />
      <Text style={[typography.heroTitle, styles.centerText]}>Good work today</Text>
      <Text style={[typography.lede, styles.centerText]}>You got useful article practice into a real conversation.</Text>

      <Card style={styles.summaryCard}>
        <Text style={typography.successLabel}>Improved</Text>
        <Text style={typography.cardTitle}>{lesson.mentorNote.improved}</Text>
        <Text style={typography.dangerLabel}>Still review</Text>
        <Text style={typography.cardTitle}>{lesson.mentorNote.stillWork}</Text>
        <Text style={typography.muted}>{lesson.mentorNote.nextFocus}</Text>
      </Card>

      <PrimaryButton label="Finish session" onPress={onFinish} />
    </ScreenFrame>
  );
}

function StoreAssistant({ size }: { size: number }) {
  return (
    <Image
      source={lenaStoreAssistant}
      style={[styles.storeAssistant, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.horizontal,
    paddingTop: 12,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  centerText: {
    textAlign: 'center',
  },
  setupStack: {
    gap: 10,
    marginTop: 22,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
  questionCard: {
    marginTop: 54,
  },
  heroMissionCard: {
    backgroundColor: colors.surface,
    marginTop: 18,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  todayGreeting: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  todaySubGreeting: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  sectionEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 4,
  },
  missionCategory: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  missionGerman: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  missionEnglish: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  missionProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  progressCompact: {
    flex: 1,
  },
  missionProgressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  reviewPreview: {
    backgroundColor: colors.surfaceAlt,
    marginTop: 18,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  reviewItemText: {
    flex: 1,
    flexShrink: 1,
  },
  reviewDueText: {
    flexShrink: 0,
    marginTop: 2,
    textAlign: 'right',
  },
  stepTimeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  stepTimelineItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepTimelineDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepTimelineLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  stepTimelineLabelActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  stepTimelineLine: {
    position: 'absolute',
    top: 4,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: colors.surfaceAlt,
  },
  stepTimelineLineActive: {
    backgroundColor: colors.primary,
  },
  promptCard: {
    backgroundColor: colors.surfaceAlt,
  },
  recallCard: {
    minHeight: 250,
    paddingBottom: 20,
  },
  answerBox: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 30,
    padding: 15,
  },
  answerText: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  answerInput: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    minHeight: 56,
    paddingHorizontal: 15,
  },
  speakPracticeBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 30,
    padding: 16,
  },
  recordArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 90,
    justifyContent: 'center',
    width: 90,
  },
  recordButtonDone: {
    backgroundColor: colors.primaryDark,
  },
  recordText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  splitActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  sceneCard: {
    backgroundColor: colors.accentTint,
    flexDirection: 'row',
    gap: 12,
  },
  storeAssistant: {
    borderRadius: 18,
  },
  coachCard: {
    backgroundColor: colors.goldTint,
    flexDirection: 'row',
    gap: 12,
  },
  coachHintCard: {
    backgroundColor: colors.surfaceAlt,
  },
  roleplaySceneSurface: {
    backgroundColor: colors.accentTint,
    gap: 12,
  },
  roleplaySceneHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sceneChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sceneChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sceneChipActive: {
    backgroundColor: colors.primarySoft,
  },
  sceneChipDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  sceneChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sceneChipTextActive: {
    color: colors.primaryDark,
  },
  sceneChipTextDisabled: {
    color: colors.muted,
  },
  conversationArea: {
    gap: 8,
    marginTop: 4,
  },
  replyPromptInline: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  voiceControlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  voiceControlButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  voiceControlButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  voiceControlText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  voiceControlTextActive: {
    color: '#ffffff',
  },
  trainerPanel: {
    backgroundColor: colors.goldTint,
    gap: 12,
  },
  trainerHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  trainerGrid: {
    gap: 8,
  },
  trainerItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  trainerItemText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  replyBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 22,
    padding: 14,
  },
  replyText: {
    color: colors.muted,
    fontSize: 13,
  },
  mistakeCard: {
    gap: 6,
  },
  summaryCard: {
    gap: 8,
    marginTop: 32,
  },
  notebookHero: {
    backgroundColor: colors.accentTint,
    flexDirection: 'row',
    gap: 12,
  },
  checkRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  checkBox: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
    width: 34,
  },
  checkBoxDone: {
    color: colors.accent,
  },
  checkText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  notebookRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  dashboardRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  assignmentMiniCard: {
    backgroundColor: colors.goldTint,
    marginTop: 0,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promptText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 34,
  },
});
