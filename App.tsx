import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
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

(Text as any).defaultProps = { ...(Text as any).defaultProps, maxFontSizeMultiplier: 1.1 };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, maxFontSizeMultiplier: 1.1 };

type Screen = 'onboarding' | 'today' | 'mission' | 'practice' | 'speaking' | 'roleplay' | 'mistakes' | 'note' | 'notebook';
type MascotState = 'idle' | 'listening' | 'encouraging' | 'correcting' | 'celebrating' | 'reviewing';

const mascots: Record<MascotState, ImageSourcePropType> = {
  idle: require('./assets/mila/mila-idle.png'),
  listening: require('./assets/mila/mila-listening.png'),
  encouraging: require('./assets/mila/mila-encouraging.png'),
  correcting: require('./assets/mila/mila-correcting.png'),
  celebrating: require('./assets/mila/mila-celebrating.png'),
  reviewing: require('./assets/mila/mila-reviewing.png'),
};

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
          onStartAssignment={startActiveAssignment}
          onQuickAction={(action) => {
            void handleQuickAction(action);
          }}
          onCommand={(command) => {
            void handleCommand(command);
          }}
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

function ScreenFrame({
  children,
  activeTab,
  onTabPress,
}: {
  children: React.ReactNode;
  activeTab?: string;
  onTabPress?: (tab: string) => void;
}) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {activeTab ? <BottomTabs active={activeTab} onTabPress={onTabPress} /> : null}
    </View>
  );
}

function OnboardingScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <ScreenFrame>
      <Mascot state="idle" size={96} centered />
      <Text style={styles.heroTitle}>Your German mentor</Text>
      <Text style={styles.lede}>Short A1.1 missions for speaking, roleplay, and mistake review.</Text>

      <View style={styles.setupStack}>
        <Pill label="Goal: everyday German" />
        <Pill label="Level: A1.1" tone="warm" />
        <Pill label="Daily: 5 minutes" />
      </View>

      <Card style={styles.questionCard}>
        <Text style={styles.cardTitle}>Start calmly.</Text>
        <Text style={styles.mutedText}>Today you practice a real situation: in a clothing shop.</Text>
      </Card>

      <PrimaryButton label="Start my first mission" onPress={onContinue} />
    </ScreenFrame>
  );
}

function TodayScreen({
  memory,
  onStart,
  onStartAssignment,
  onQuickAction,
  onCommand,
  onTabPress,
}: {
  memory: AppMemory;
  onStart: () => void;
  onStartAssignment: () => void;
  onQuickAction: (action: QuickAction) => void;
  onCommand: (command: string) => void;
  onTabPress: (tab: string) => void;
}) {
  const weakWords = memory.weakItems.length ? memory.weakItems : lesson.weakWords;
  const [command, setCommand] = useState('');
  const activeMission = memory.missions[0];

  return (
    <ScreenFrame activeTab="Today" onTabPress={onTabPress}>
      <HeaderWithMascot title={`${lesson.level} Today`} subtitle="Mila prepared one guided mission" state="idle" />

      <Card style={styles.mentorCard}>
        <Mascot state="encouraging" size={56} />
        <View style={styles.flex}>
          <Text style={styles.successLabel}>Clothing shop mission</Text>
          <Text style={styles.cardTitle}>Ask for a sweater in size M.</Text>
          <Text style={styles.mutedText}>German target: Ich suche einen Pullover in Größe M.</Text>
          <Text style={styles.englishGuide}>English help stays visible so this still feels like learning, not a German-only app.</Text>
          <View style={styles.rowWrap}>
            <Pill label="der Pullover" />
            <Pill label="einen Pullover" tone="warm" />
            <Pill label="size M" />
          </View>
        </View>
      </Card>

      <PrimaryButton label="Start mission" onPress={onStart} />

      {activeMission ? (
        <MissionCard mission={activeMission} />
      ) : null}

      <Text style={styles.sectionTitle}>Guided path</Text>
      <Card>
        {lesson.prescription.map((item, index) => (
          <View key={item.step} style={styles.prescriptionRow}>
            <View style={[styles.stepBadge, index === 0 && styles.stepBadgeActive]}>
              <Text style={[styles.stepBadgeText, index === 0 && styles.stepBadgeTextActive]}>{index + 1}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.pathText}>{item.step}</Text>
              <Text style={styles.mutedText}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Weak words</Text>
      <View style={styles.rowWrap}>
        {weakWords.slice(0, 4).map((word, index) => (
          <Pill key={`${word}-${index}`} label={word} tone={index % 2 ? 'warm' : 'mint'} />
        ))}
      </View>

      <Card style={styles.notebookPreview}>
        <Text style={styles.cardTitle}>Learning Notebook</Text>
        <Text style={styles.mutedText}>Saved words, rules, and review items.</Text>
        <View style={styles.rowWrap}>
          <Pill label={`${Math.max(memory.words.length, lesson.notebook.words.length)} words`} />
          <Pill label={`${Math.max(memory.sentences.length, lesson.notebook.sentences.length)} sentences`} tone="warm" />
          <Pill label={`${memory.mistakes.length} saved mistakes`} tone="danger" />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Optional trainer controls</Text>
      <Card style={styles.trainerCard}>
        <Text style={styles.cardTitle}>Ask Mila for extra practice</Text>
        <Text style={styles.mutedText}>The mission is the main path. These are secondary controls for later practice.</Text>
        <View style={styles.commandWrap}>
          <TextInput
            value={command}
            onChangeText={setCommand}
            placeholder="I am weak in articles"
            placeholderTextColor="#8f948c"
            style={styles.commandInput}
          />
          <PrimaryButton
            label="Ask Mila"
            onPress={() => {
              const trimmed = command.trim();
              if (!trimmed) return;
              onCommand(trimmed);
              setCommand('');
            }}
          />
        </View>
        <View style={styles.quickGrid}>
          <SmallAction label="Revise weak area" onPress={() => onQuickAction('revise')} />
          <SmallAction label="Quiz me" onPress={() => onQuickAction('quiz')} />
          <SmallAction label="Start roleplay" onPress={() => onQuickAction('roleplay')} />
          <SmallAction label="Repeat lesson" onPress={() => onQuickAction('repeat')} />
        </View>
      </Card>

      {memory.activeAssignment ? (
        <AssignmentCard assignment={memory.activeAssignment} onStart={onStartAssignment} />
      ) : null}

      {memory.completedSessions > 0 ? (
        <Card style={styles.memoryCard}>
          <Text style={styles.cardTitle}>Mila remembered</Text>
          <Text style={styles.mutedText}>{memory.lastMentorNote}</Text>
        </Card>
      ) : null}
    </ScreenFrame>
  );
}

function AssignmentCard({ assignment, onStart }: { assignment: Assignment; onStart: () => void }) {
  return (
    <Card style={styles.assignmentCard}>
      <Text style={styles.successLabel}>{sourceLabel(assignment.source)}</Text>
      <Text style={styles.cardTitle}>{assignment.title}</Text>
      <Text style={styles.mutedText}>{assignment.mentorMessage}</Text>
      <View style={styles.rowWrap}>
        {assignment.targetWords.map((word) => (
          <Pill key={word} label={word} />
        ))}
      </View>
      <Text style={styles.targetLine}>Regel: {assignment.targetRules[0]}</Text>
      <Text style={styles.correctionText}>Achte auf: {assignment.mistakeWatch.join(', ')}</Text>
      {assignment.roleplay ? (
        <Text style={styles.englishGuide}>
          Figur: {assignment.roleplay.character} · Szene: {assignment.roleplay.scene}
        </Text>
      ) : null}
      <PrimaryButton label={assignment.nextAction} onPress={onStart} />
    </Card>
  );
}

function MissionCard({ mission }: { mission: ReturnType<typeof upsertMission>[number] }) {
  return (
    <Card style={styles.missionCard}>
      <Text style={styles.successLabel}>Fehler-Mission</Text>
      <Text style={styles.cardTitle}>{mission.title}</Text>
      <Text style={styles.mutedText}>{missionPathLabel(mission)}</Text>
      <View style={styles.rowWrap}>
        <Pill label={`Jetzt: ${missionStageLabel(mission.stage)}`} tone="warm" />
        <Pill label={mission.status} />
      </View>
    </Card>
  );
}

function SmallAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.smallAction} onPress={onPress}>
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

const missionSteps = ['Notice', 'Rule', 'Recall', 'Speak', 'Roleplay', 'Review'];

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
      <HeaderWithMascot
        title={step}
        subtitle="Clothing shop: ask for a sweater in size M"
        state={step === 'Review' ? 'reviewing' : 'encouraging'}
      />

      <View style={styles.missionStepRow}>
        {missionSteps.map((item, index) => (
          <Text key={item} style={[styles.stepChip, index === stepIndex && styles.stepChipActive]}>{item}</Text>
        ))}
      </View>

      <ProgressBar active={Math.min(stepIndex + 1, 4)} />

      {step === 'Notice' ? (
        <Card style={styles.promptCard}>
          <Text style={styles.caption}>Mila says</Text>
          <Text style={styles.promptStrong}>Ich suche einen Pullover in Größe M.</Text>
          <Text style={styles.englishGuide}>English help: I am looking for a sweater in size M.</Text>
          <View style={styles.rowWrap}>
            <Pill label="der Pullover" />
            <Pill label="einen Pullover" tone="warm" />
          </View>
        </Card>
      ) : null}

      {step === 'Rule' ? (
        <Card>
          <Text style={styles.caption}>Tiny rule</Text>
          <Text style={styles.cardTitle}>After suchen, der Pullover changes to einen Pullover.</Text>
          <Text style={styles.ruleText}>{targetRule}</Text>
          <Text style={styles.englishGuide}>English help: after suchen, der Pullover becomes einen Pullover.</Text>
          <Text style={styles.correctionText}>Watch: do not say eine Pullover.</Text>
        </Card>
      ) : null}

      {step === 'Recall' ? (
        <Card style={styles.recallCard}>
          <Text style={styles.caption}>Active recall</Text>
          <Text style={styles.promptStrong}>Ich suche ____ ____ in Größe M.</Text>
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
              <Text style={recallCorrect ? styles.correctText : styles.correctionText}>
                {recallCorrect ? 'Correct. Now use the whole sentence.' : 'Almost. Mila saves this weak spot for later review.'}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {step === 'Speak' ? (
        <Card>
          <Text style={styles.caption}>Speak once</Text>
          <Text style={styles.promptStrong}>{targetSentence}</Text>
          <Text style={styles.englishGuide}>English help: say the full shop sentence out loud.</Text>
          <View style={styles.recordArea}>
            <Pressable style={styles.recordButton} onPress={() => setChecked((prev) => !prev)}>
              <Text style={styles.recordText}>SPEAK</Text>
            </Pressable>
          </View>
          {checked ? (
            <View style={styles.speakPracticeBox}>
              <Text style={styles.correctText}>Saved. Mila will reuse this sentence in the roleplay.</Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      {step === 'Roleplay' ? (
        <>
          <Card style={styles.sceneCard}>
            <View style={styles.flex}>
              <Text style={styles.caption}>Scene</Text>
              <Text style={styles.cardTitle}>Lisa</Text>
              <Text style={styles.mutedText}>Clothing shop assistant</Text>
              <Text style={styles.targetLine}>Target: {targetSentence}</Text>
            </View>
            <StoreAssistant size={96} />
          </Card>
          <Card style={styles.coachCard}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Mila (Coach)</Text>
              <Text style={styles.mutedText}>Stay in the scene in German. English is only help text.</Text>
              <Text style={styles.englishGuide}>English help: {lesson.roleplay.englishHint}</Text>
            </View>
            <Mascot state="encouraging" size={48} />
          </Card>
          {roleplayReplied ? (
            <>
              <ChatBubble side="right" text="Ich suche einen Pullover in Größe M." />
              <ChatBubble side="left" text="Sehr gern. Einen Pullover in Größe M." />
              <Card style={styles.coachHintCard}>
                <Text style={styles.caption}>Mila correction</Text>
                <Text style={styles.correctText}>Gut. Du hast einen Pullover gesagt, nicht eine Pullover.</Text>
              </Card>
            </>
          ) : (
            <Card style={styles.coachHintCard}>
              <Text style={styles.caption}>Mila hint</Text>
              <Text style={styles.targetLine}>{targetSentence}</Text>
              <Text style={styles.englishGuide}>English help: use this with Lisa now.</Text>
            </Card>
          )}
        </>
      ) : null}

      {step === 'Review' ? (
        <Card style={styles.summaryCard}>
          <Text style={styles.successLabel}>Saved to Notebook</Text>
          <Text style={styles.cardTitle}>Weak word: der Pullover</Text>
          <Text style={styles.cardTitle}>Rule: {targetRule}</Text>
          <Text style={styles.wrongSmall}>{lesson.savedMistake.wrong}</Text>
          <Text style={styles.rightSmall}>{lesson.savedMistake.correct}</Text>
          <Text style={styles.reviewText}>Next review: {lesson.savedMistake.nextReview}</Text>
        </Card>
      ) : null}

      <View style={styles.splitActions}>
        <SecondaryButton label={step === 'Review' ? 'Again' : 'Mila hint'} onPress={() => setChecked(true)} />
        <PrimaryButton
          label={step === 'Review' ? 'Save to Notebook' : step === 'Recall' && !checked ? 'Check answer' : step === 'Roleplay' && !roleplayReplied ? 'Reply to Lisa' : 'Continue'}
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
      <Text style={styles.screenTitle}>Active recall</Text>
      <Text style={styles.lede}>Answer first. Mila shows the correction only after you try.</Text>

      {assignment ? (
        <Card style={styles.assignmentMiniCard}>
          <Text style={styles.successLabel}>{sourceLabel(assignment.source)}</Text>
          <Text style={styles.cardTitle}>{assignment.title}</Text>
          <Text style={styles.mutedText}>Mila is watching: {assignment.mistakeWatch.join(', ')}</Text>
        </Card>
      ) : null}

      <Card style={styles.recallCard}>
        <View style={styles.cardTopRow}>
          <Pill label={isSpeakCard ? 'Speak card' : 'Type card'} tone="warm" />
          <Text style={styles.caption}>{cardIndex + 1}/{lesson.practiceCards.length}</Text>
        </View>
        <Text style={styles.promptText}>{card.prompt}</Text>
        <Text style={styles.englishGuide}>{assignmentRule ? `Mila rule: ${assignmentRule}` : card.englishGuide}</Text>

        {isSpeakCard ? (
          <View style={styles.speakPracticeBox}>
            <Mascot state={checked ? 'celebrating' : 'listening'} size={66} />
            <Text style={styles.targetLine}>{checked ? card.answer : 'Say it before you reveal it.'}</Text>
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
            <Text style={isCorrect || isSpeakCard ? styles.correctText : styles.correctionText}>
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
      <Text style={styles.screenTitle}>Speak</Text>
      <Text style={styles.lede}>{lesson.speakingTask.prompt}</Text>

      <Card style={styles.promptCard}>
        <Text style={styles.caption}>{phase === 'listen' ? 'Listen' : phase === 'speak' ? 'Speak' : 'Repair'}</Text>
        <Text style={styles.promptStrong}>{lesson.speakingTask.starter}</Text>
        <Text style={styles.englishGuide}>
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
          <Text style={styles.caption}>Heard</Text>
          <Text style={styles.cardTitle}>{lesson.speakingTask.transcript}</Text>
          <Text style={styles.targetLine}>German target: {lesson.speakingTask.target}</Text>
          <Text style={styles.correctionText}>{lesson.speakingTask.correction}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.caption}>Mila</Text>
          <Text style={styles.cardTitle}>{phase === 'listen' ? lesson.speakingTask.target : lesson.speakingTask.retryPrompt}</Text>
          <Text style={styles.mutedText}>This MVP simulates listening locally. Your correction is still saved to review.</Text>
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
  const roleplay = assignment?.roleplay;
  const character = roleplay?.character ?? lesson.roleplay.character;
  const scene = roleplay?.scene ?? lesson.roleplay.scenario;
  const goal = roleplay?.goal ?? lesson.roleplay.learnerGoal;
  const targetWords = assignment?.targetWords ?? lesson.roleplay.todayWords;
  const targetRule = assignment?.targetRules[0] ?? lesson.roleplay.hint;

  return (
    <ScreenFrame activeTab="Roleplay" onTabPress={onTabPress}>
      <HeaderWithMascot title="Roleplay" subtitle={scene} state="idle" />

      <Card style={styles.sceneCard}>
        <StoreAssistant size={64} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{character}</Text>
          <Text style={styles.mutedText}>In-scene character. She stays in German.</Text>
          <Text style={styles.englishGuide}>Goal: {goal}</Text>
        </View>
      </Card>

      <Card style={styles.coachCard}>
        <Mascot state="encouraging" size={52} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Mila coach</Text>
          <Text style={styles.mutedText}>English guidance stays outside the scene. Use it only when stuck.</Text>
          <View style={styles.rowWrap}>
            {targetWords.map((word) => (
              <Pill key={word} label={word} />
            ))}
          </View>
        </View>
      </Card>

      {lesson.roleplay.turns.slice(0, replied ? lesson.roleplay.turns.length : 1).map((turn, index) => (
        <ChatBubble key={`${turn.speaker}-${index}`} side={turn.speaker === 'learner' ? 'right' : 'left'} text={turn.text} />
      ))}

      <Card style={styles.coachHintCard}>
        <Text style={styles.caption}>Mila hint</Text>
        <Text style={styles.targetLine}>German target: {targetRule}</Text>
        <Text style={styles.englishGuide}>English guide: {lesson.roleplay.englishHint}</Text>
      </Card>
      <View style={styles.replyBox}>
        <Text style={styles.replyText}>{replied ? lesson.roleplay.successLine : 'Speak or type your reply'}</Text>
      </View>

      <View style={styles.splitActions}>
        <SecondaryButton label="Use Mila hint" onPress={() => setReplied(true)} />
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
      <HeaderWithMascot title="Mistakes" subtitle="Your personal trainer" state="correcting" />

      {mistakes.map((mistake) => (
        <Card key={mistake.id} style={styles.mistakeCard}>
          <Text style={styles.dangerLabel}>{mistake.tag}</Text>
          <Text style={styles.wrongText}>{mistake.wrong}</Text>
          <Text style={styles.rightText}>{mistake.correct}</Text>
          <Text style={styles.mutedText}>{mistake.rule}</Text>
          <View style={styles.rowWrap}>
            <Pill label={`${mistake.timesWrong} times wrong`} tone="danger" />
            <Pill label={`Review ${mistake.nextReview.toLowerCase()}`} tone="warm" />
          </View>
          {memory.missions.find((mission) => mission.mistakeId === mistake.id) ? (
            <Text style={styles.targetLine}>
              Mission: {missionPathLabel(memory.missions.find((mission) => mission.mistakeId === mistake.id)!)}
            </Text>
          ) : null}
          {reviewed ? (
            <Text style={styles.correctText}>Fixed once now. Mila will bring it back tomorrow.</Text>
          ) : null}
        </Card>
      ))}

      <View style={styles.replyBox}>
        <Text style={styles.caption}>Quick repair</Text>
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
  const checklistStatus = [
    memory.loopProgress.includes('practice') || finishedSession,
    memory.loopProgress.includes('speaking') || finishedSession,
    hasMistake,
    memory.loopProgress.includes('roleplay') || finishedSession,
  ];

  return (
    <ScreenFrame activeTab="Notebook" onTabPress={onTabPress}>
      <HeaderWithMascot title="Learning Notebook" subtitle="Words, rules, mistakes, and review items Mila saved for you." state="reviewing" />

      <Card style={styles.notebookHero}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Review due</Text>
          <Text style={styles.mutedText}>
            {memory.reviewDue.length
              ? memory.reviewDue.slice(0, 2).join(' · ')
              : hasMistake
                ? 'Tomorrow: practice einen Pullover again.'
                : 'Nothing urgent yet. Finish a session to unlock review.'}
          </Text>
        </View>
        <Mascot state="reviewing" size={54} />
      </Card>

      {memory.missions.length ? (
        <>
          <Text style={styles.sectionTitle}>Mila missions</Text>
          <Card>
            {memory.missions.map((mission) => (
              <View key={mission.id} style={styles.notebookRow}>
                <Text style={styles.germanText}>{mission.title}</Text>
                <Text style={styles.englishText}>{missionPathLabel(mission)}</Text>
                <Text style={styles.reviewText}>Now: {missionStageLabel(mission.stage)} · Review: {mission.nextReview}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {memory.activeAssignment ? (
        <>
          <Text style={styles.sectionTitle}>Latest Mila assignment</Text>
          <Card>
            <Text style={styles.germanText}>{memory.activeAssignment.title}</Text>
            <Text style={styles.englishText}>Source: {sourceLabel(memory.activeAssignment.source)}</Text>
            <Text style={styles.reviewText}>{memory.activeAssignment.nextAction}</Text>
          </Card>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Today you practiced</Text>
      <Card>
        {lesson.notebook.checklist.map((item, index) => (
          <View key={item.label} style={styles.checkRow}>
            <Text style={[styles.checkBox, checklistStatus[index] && styles.checkBoxDone]}>{checklistStatus[index] ? '●' : '○'}</Text>
            <Text style={styles.checkText}>{item.label}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Words learned</Text>
      <Card>
        {words.map((item) => (
          <View key={item.id} style={styles.notebookRow}>
            <Text style={styles.germanText}>{item.german}</Text>
            <Text style={styles.englishText}>{item.english}</Text>
            {item.source ? <Text style={styles.reviewText}>Source: {item.source}</Text> : null}
            {item.reviewDue ? <Text style={styles.reviewText}>Review: {item.reviewDue}</Text> : null}
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Sentences learned</Text>
      <Card>
        {sentences.map((item) => (
          <View key={item.id} style={styles.notebookRow}>
            <Text style={styles.germanText}>{item.german}</Text>
            <Text style={styles.englishText}>{item.english}</Text>
            {item.source ? <Text style={styles.reviewText}>Source: {item.source}</Text> : null}
            {item.reviewDue ? <Text style={styles.reviewText}>Review: {item.reviewDue}</Text> : null}
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Rules learned</Text>
      <Card>
        {rules.map((rule) => (
          <View key={rule.id} style={styles.notebookRow}>
            <Text style={styles.ruleText}>{rule.text}</Text>
            {rule.source ? <Text style={styles.reviewText}>Source: {rule.source}</Text> : null}
            {rule.reviewDue ? <Text style={styles.reviewText}>Review: {rule.reviewDue}</Text> : null}
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Mistakes fixed</Text>
      <Card>
        {(memory.mistakes.length ? memory.mistakes : [lesson.savedMistake]).map((mistake) => (
          <View key={mistake.id} style={styles.notebookRow}>
            <Text style={styles.wrongSmall}>{mistake.wrong}</Text>
            <Text style={styles.rightSmall}>{mistake.correct}</Text>
            <Text style={styles.englishText}>{mistake.rule}</Text>
            <Text style={styles.reviewText}>Source: Mistake mission · Review: {mistake.nextReview}</Text>
          </View>
        ))}
      </Card>
    </ScreenFrame>
  );
}

function MentorNoteScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <ScreenFrame>
      <Mascot state="celebrating" size={120} centered />
      <Text style={[styles.heroTitle, styles.centerText]}>Good work today</Text>
      <Text style={[styles.lede, styles.centerText]}>You got useful article practice into a real conversation.</Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.successLabel}>Improved</Text>
        <Text style={styles.cardTitle}>{lesson.mentorNote.improved}</Text>
        <Text style={styles.dangerLabel}>Still review</Text>
        <Text style={styles.cardTitle}>{lesson.mentorNote.stillWork}</Text>
        <Text style={styles.mutedText}>{lesson.mentorNote.nextFocus}</Text>
      </Card>

      <PrimaryButton label="Finish session" onPress={onFinish} />
    </ScreenFrame>
  );
}

function HeaderWithMascot({
  title,
  subtitle,
  state,
}: {
  title: string;
  subtitle: string;
  state: MascotState;
}) {
  return (
    <View style={styles.headerWithMascot}>
      <View style={styles.headerTextGroup}>
        <Text style={styles.screenTitle}>{title}</Text>
        <Text style={styles.lede}>{subtitle}</Text>
      </View>
      <View style={styles.headerAvatarWrap}>
        <Mascot state={state} size={60} />
      </View>
    </View>
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

function Mascot({ state, size, centered }: { state: MascotState; size: number; centered?: boolean }) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    motion.setValue(0);
    const duration = state === 'listening' ? 760 : state === 'correcting' ? 420 : 1200;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [motion, state]);

  const translateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: state === 'correcting' ? [0, 0] : [0, -6],
  });
  const translateX = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: state === 'correcting' ? [-3, 3, -3] : [0, 0, 0],
  });
  const scale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: state === 'listening' ? [1, 1.08] : state === 'celebrating' ? [1, 1.05] : [1, 1],
  });

  return (
    <Animated.View style={[centered && styles.centerMascot, { transform: [{ translateY }, { translateX }, { scale }] }]}>
      <Image source={mascots[state]} style={[styles.mascot, { width: size, height: size }]} resizeMode="contain" />
    </Animated.View>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Pill({ label, tone = 'mint' }: { label: string; tone?: 'mint' | 'warm' | 'danger' }) {
  return <Text style={[styles.pill, tone === 'warm' && styles.pillWarm, tone === 'danger' && styles.pillDanger]}>{label}</Text>;
}

function PrimaryButton({ label, onPress, compact }: { label: string; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable style={[styles.primaryButton, compact && styles.compactButton]} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, dark }: { label: string; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable style={[styles.secondaryButton, dark && styles.darkButton]} onPress={onPress}>
      <Text style={[styles.secondaryButtonText, dark && styles.darkButtonText]}>{label}</Text>
    </Pressable>
  );
}

function ProgressBar({ active }: { active: number }) {
  return (
    <View style={styles.progressBar}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.progressSegment, item >= active && styles.progressSegmentOff]} />
      ))}
    </View>
  );
}

function ChatBubble({ side, text }: { side: 'left' | 'right'; text: string }) {
  return (
    <View style={[styles.chatBubble, side === 'right' && styles.chatBubbleRight]}>
      <Text style={[styles.chatText, side === 'right' && styles.chatTextRight]}>{text}</Text>
    </View>
  );
}

function BottomTabs({ active, onTabPress }: { active: string; onTabPress?: (tab: string) => void }) {
  const tabs = [
    { key: 'Today', label: 'Today', icon: 'T' },
    { key: 'Practice', label: 'Practice', icon: 'P' },
    { key: 'Roleplay', label: 'Roleplay', icon: 'R' },
    { key: 'Notebook', label: 'Notebook', icon: 'N' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} onPress={() => onTabPress?.(tab.key)} style={styles.tabItem}>
          <View style={[styles.tabIcon, active === tab.key && styles.tabIconActive]}>
            <Text style={[styles.tabIconText, active === tab.key && styles.tabIconTextActive]}>{tab.icon}</Text>
          </View>
          <Text style={[styles.tabText, active === tab.key && styles.tabTextActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const colors = {
  background: '#fff9ee',
  paper: '#fffdf8',
  soft: '#fff2d7',
  mint: '#dff7ea',
  green: '#1A5D3A',
  greenDark: '#0f4a3d',
  primaryDark: '#0f4a3d',
  primarySoft: '#E8F0E9',
  accent: '#18a873',
  gold: '#D4A017',
  amber: '#D97706',
  surfaceAlt: '#e5eadd',
  ink: '#17201c',
  muted: '#68746e',
  line: '#ead8b9',
  coral: '#ef705d',
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 148,
  },
  mascot: {
    borderRadius: 14,
  },
  centerMascot: {
    alignSelf: 'center',
  },
  loadingTitle: {
    color: colors.greenDark,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 34,
    marginTop: 8,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 30,
  },
  lede: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
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
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillWarm: {
    backgroundColor: '#FFF8E1',
    color: colors.gold,
  },
  pillDanger: {
    backgroundColor: '#ffe3dc',
    color: colors.coral,
  },
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 3,
    marginTop: 18,
    padding: 18,
    shadowColor: '#503717',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
  },
  questionCard: {
    marginTop: 54,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  mutedText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    elevation: 4,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 54,
    paddingHorizontal: 18,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  compactButton: {
    flex: 1,
    marginTop: 0,
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    color: colors.greenDark,
    fontSize: 14,
    fontWeight: '900',
  },
  darkButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  darkButtonText: {
    color: '#ffffff',
  },
  headerWithMascot: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    marginTop: 0,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerAvatarWrap: {
    alignItems: 'flex-end',
    width: 60,
  },
  headerAvatarLargeWrap: {
    alignItems: 'flex-end',
    width: 96,
  },
  dashboardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  flex: {
    flex: 1,
  },
  cardHeroTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  inlineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  mentorCardToday: {
    backgroundColor: colors.mint,
  },
  mentorHeaderRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  quickGridQuiet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  assignmentPanel: {
    backgroundColor: colors.paper,
  },
  trainerCardToday: {
    backgroundColor: colors.soft,
  },
  commandCard: {
    backgroundColor: colors.paper,
  },
  mentorCard: {
    backgroundColor: colors.mint,
    flexDirection: 'row',
    gap: 12,
  },
  trainerCard: {
    backgroundColor: '#fff8e8',
    gap: 12,
  },
  commandWrap: {
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  commandInput: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallAction: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  smallActionText: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '900',
  },
  assignmentCard: {
    backgroundColor: colors.mint,
  },
  missionCard: {
    backgroundColor: '#fff8e8',
  },
  missionProgressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  missionProgressTrack: {
    backgroundColor: '#e5dccf',
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  missionProgressFill: {
    backgroundColor: colors.green,
    borderRadius: 999,
    height: '100%',
    width: '60%',
  },
  progressMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 24,
  },
  sectionEyebrow: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pathList: {
    gap: 13,
    marginTop: 14,
  },
  pathItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  pathDot: {
    borderColor: colors.green,
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  pathDotActive: {
    backgroundColor: colors.green,
  },
  pathText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  prescriptionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: '#e5ddcf',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stepBadgeActive: {
    backgroundColor: colors.green,
  },
  stepBadgeText: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '800',
  },
  stepBadgeTextActive: {
    color: '#ffffff',
  },
  missionStepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 16,
  },
  stepChip: {
    backgroundColor: '#e5ddcf',
    borderRadius: 999,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  stepChipActive: {
    backgroundColor: colors.mint,
    color: colors.greenDark,
  },
  memoryCard: {
    backgroundColor: colors.soft,
  },
  notebookPreview: {
    backgroundColor: '#fff8e8',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 22,
    marginTop: 10,
  },
  progressSegment: {
    backgroundColor: colors.green,
    borderRadius: 999,
    flex: 1,
    height: 6,
  },
  progressSegmentOff: {
    backgroundColor: '#dedbd2',
  },
  recallCard: {
    minHeight: 250,
    paddingBottom: 20,
  },
  assignmentMiniCard: {
    backgroundColor: '#fff8e8',
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
  englishGuide: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 8,
  },
  bigAnswer: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 12,
  },
  answerBox: {
    backgroundColor: '#f5efe4',
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 30,
    padding: 15,
  },
  answerText: {
    color: colors.greenDark,
    fontSize: 18,
    fontWeight: '800',
  },
  answerInput: {
    backgroundColor: '#f5efe4',
    borderColor: colors.line,
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
    backgroundColor: '#f5efe4',
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 30,
    padding: 16,
  },
  correctText: {
    color: colors.greenDark,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  feedbackRow: {
    alignItems: 'stretch',
    flexDirection: 'column',
    marginTop: 16,
  },
  feedbackTextWrap: {
    width: '100%',
  },
  feedbackMascotBadge: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#eef8e7',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'hidden',
    width: 58,
  },
  promptCard: {
    backgroundColor: colors.soft,
  },
  caption: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  promptStrong: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  recordArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
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
  correctionText: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    marginTop: 8,
  },
  targetLine: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 10,
  },
  splitActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  sceneCard: {
    backgroundColor: colors.mint,
    flexDirection: 'row',
    gap: 12,
  },
  storeAssistant: {
    borderRadius: 18,
  },
  coachCard: {
    backgroundColor: '#fff8e8',
    flexDirection: 'row',
    gap: 12,
  },
  coachHintCard: {
    backgroundColor: colors.soft,
  },
  chatBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    maxWidth: '82%',
    padding: 14,
  },
  chatBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chatText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  chatTextRight: {
    color: '#ffffff',
  },
  replyBox: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 22,
    padding: 14,
  },
  replyText: {
    color: '#9c958a',
    fontSize: 13,
  },
  mistakeCard: {
    gap: 6,
  },
  dangerLabel: {
    color: colors.coral,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6,
  },
  successLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  wrongText: {
    color: colors.coral,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  rightText: {
    color: colors.greenDark,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryCard: {
    gap: 8,
    marginTop: 32,
  },
  notebookHero: {
    backgroundColor: colors.mint,
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
    color: colors.green,
  },
  checkText: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  notebookRow: {
    borderBottomColor: '#f0e3ca',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  germanText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  englishText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  ruleText: {
    color: colors.greenDark,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    marginBottom: 10,
  },
  reviewText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },
  wrongSmall: {
    color: colors.coral,
    fontSize: 14,
    fontWeight: '900',
  },
  rightSmall: {
    color: colors.greenDark,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.94)',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    height: 58,
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    gap: 4,
    justifyContent: 'center',
  },
  tabIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  tabIconActive: {
    backgroundColor: colors.green,
  },
  tabIconText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  tabIconTextActive: {
    color: '#ffffff',
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.green,
  },
});
