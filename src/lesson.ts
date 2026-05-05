export type PracticeCard = {
  id: string;
  type: 'article_recall' | 'sentence_repair' | 'translate' | 'speak_card';
  mode: 'type' | 'speak';
  prompt: string;
  englishGuide: string;
  answer: string;
  weakItem: string;
  feedback: string;
};

export type Mistake = {
  id: string;
  tag: string;
  wrong: string;
  correct: string;
  rule: string;
  timesWrong: number;
  nextReview: string;
};

export const lesson = {
  id: 'a1-001-clothing-shop',
  level: 'A1.1',
  topic: 'Clothing shop',
  title: 'Ask for a sweater',
  mentorMessage:
    'Today Mila fixes one small article mistake and uses it immediately in a clothing shop.',
  todayFocus: 'der Pullover -> einen Pullover',
  reason: 'Chosen from your article memory.',
  weakWords: ['der Pullover', 'einen Pullover', 'Größe M'],
  path: ['Notice', 'Rule', 'Recall', 'Speak', 'Roleplay', 'Review'],
  prescription: [
    { step: 'Notice', detail: 'Mila shows the shop sentence and the weak word.' },
    { step: 'Rule', detail: 'One tiny rule: after suchen, der becomes einen.' },
    { step: 'Recall', detail: 'Type the missing words: einen Pullover.' },
    { step: 'Speak', detail: 'Say the full sentence once.' },
    { step: 'Roleplay', detail: 'Use it with Lisa in the clothing shop.' },
    { step: 'Review', detail: 'Save the word, rule, mistake, and next review.' },
  ],
  practiceCards: [
    {
      id: 'card-pullover',
      type: 'article_recall',
      mode: 'type',
      prompt: 'German target: der Pullover',
      englishGuide: 'English guide: the sweater',
      answer: 'der Pullover',
      weakItem: 'der Pullover',
      feedback: 'Correct. Pullover is masculine, so the article is der.',
    },
    {
      id: 'card-einen-pullover',
      type: 'sentence_repair',
      mode: 'type',
      prompt: 'German target: Ich suche einen Pullover.',
      englishGuide: 'English guide: I am looking for a sweater.',
      answer: 'Ich suche einen Pullover.',
      weakItem: 'einen Pullover',
      feedback: 'Pullover is masculine, so use einen in accusative.',
    },
    {
      id: 'card-speak-size',
      type: 'speak_card',
      mode: 'speak',
      prompt: 'Speak it: I am looking for a sweater in size M.',
      englishGuide: 'English help: say the full shop sentence out loud.',
      answer: 'Ich suche einen Pullover in Größe M.',
      weakItem: 'Größe M',
      feedback: 'Great. This is the sentence you will reuse in roleplay.',
    },
  ] satisfies PracticeCard[],
  speakingTask: {
    prompt: 'Ask for a sweater in size M.',
    listenCue: 'Listen to Mila, then repeat with the article einen.',
    starter: 'Entschuldigung, ich suche ...',
    target: 'Ich suche einen Pullover in Größe M.',
    englishGuide: 'I am looking for a sweater in size M.',
    transcript: 'Ich suche eine Pullover in Größe M.',
    correction: 'Tiny fix: Pullover is masculine, so say einen Pullover.',
    retryPrompt: 'Again, slowly: Ich suche einen Pullover in Größe M.',
  },
  roleplay: {
    scenario: 'Clothing shop',
    character: 'Lisa',
    learnerGoal: 'Ask for a sweater in size M.',
    todayWords: ['der Pullover', 'einen Pullover', 'Größe M'],
    turns: [
      { speaker: 'assistant', text: 'Guten Tag! Wie kann ich Ihnen helfen?' },
      { speaker: 'learner', text: 'Ich suche einen Pullover in Größe M.' },
      { speaker: 'assistant', text: 'Einen Pullover in Größe M, richtig?' },
      { speaker: 'learner', text: 'Ja, danke. Kann ich mit der Karte bezahlen?' },
    ],
    hint: 'Use: Ich suche einen Pullover.',
    englishHint: 'I am looking for a sweater.',
    successLine: 'Ja, ich suche einen Pullover in Größe M.',
  },
  savedMistake: {
    id: 'mistake-pullover-accusative',
    tag: 'Article',
    wrong: 'Ich suche eine Pullover',
    correct: 'Ich suche einen Pullover',
    rule: 'Der Pullover ist maskulin. Nach suchen: einen Pullover.',
    timesWrong: 2,
    nextReview: 'Tomorrow',
  } satisfies Mistake,
  mentorNote: {
    improved: 'Du hast einen Pullover in einem echten Satz benutzt.',
    stillWork: 'Merke: suchen + maskulin = einen Pullover.',
    nextFocus: 'Tomorrow we will use the same rule in a train-station scene.',
    encouragement: 'Good work today. One useful mistake saved, one real sentence practiced.',
  },
  trainerDefaults: {
    targetWords: ['der Pullover', 'einen Pullover', 'Größe M'],
    targetRules: ['Nach suchen wird der Pullover zu einen Pullover.'],
    mistakeWatch: ['eine Pullover'],
    roleplay: {
      character: 'Lisa',
      scene: 'Clothing shop',
      goal: 'Ask for a sweater in size M without saying eine Pullover.',
    },
    missionStages: ['Notice', 'Rule', 'Recall', 'Speak', 'Roleplay', 'Review'],
  },
  notebook: {
    words: [
      { id: 'word-pullover', german: 'der Pullover', english: 'the sweater', reviewDue: 'Tomorrow' },
      { id: 'word-groesse', german: 'die Größe', english: 'the size', reviewDue: 'In 2 days' },
      { id: 'word-suchen', german: 'suchen', english: 'to look for', reviewDue: 'Tomorrow' },
    ],
    sentences: [
      { id: 'sent-pullover', german: 'Ich suche einen Pullover.', english: 'I am looking for a sweater.', reviewDue: 'Tomorrow' },
      { id: 'sent-size', german: 'Ich suche einen Pullover in Größe M.', english: 'I am looking for a sweater in size M.', reviewDue: 'Tomorrow' },
    ],
    rules: [
      { id: 'rule-der-pullover', text: 'Pullover is masculine: der Pullover.', reviewDue: 'Tomorrow' },
      { id: 'rule-suchen-accusative', text: 'After suchen, masculine nouns use accusative: einen Pullover.', reviewDue: 'Tomorrow' },
    ],
    checklist: [
      { label: 'Remembered der Pullover', completeAfter: 'practice' },
      { label: 'Used einen Pullover in a sentence', completeAfter: 'speaking' },
      { label: 'Fixed one article mistake', completeAfter: 'mistake' },
      { label: 'Use it correctly in one more roleplay', completeAfter: 'next' },
    ],
  },
};
