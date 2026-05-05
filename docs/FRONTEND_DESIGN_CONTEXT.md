# Frontend Design Context For German Mentor

Use this file as the context prompt for cto.new, Kimi 2.6, Perplexity, Muse Spark, or any frontend design/code assistant.

## What This App Is

German Mentor is a local-first Expo React Native app for a beginner German learner.

The learner is an Indian Telugu/English speaker at A1.1. The app should help them speak useful daily-life German without freezing.

Mila is the learner's private German coach. Mila is not only a mascot. She prepares missions, gives hints, remembers mistakes, and sends weak items to the Notebook.

The product is not a content browser, quiz toy, or German-only flashcard app. It is a guided training loop:

```text
Mistake -> Tiny rule -> Recall -> Speak -> Roleplay -> Review -> Notebook
```

## Current First Mission

Do not change the first mission.

```text
Clothing shop: ask for a sweater in size M.
```

German target:

```text
Ich suche einen Pullover in Größe M.
```

Weak word:

```text
der Pullover
```

Tiny rule:

```text
After suchen, masculine der becomes einen.
der Pullover -> einen Pullover
```

Roleplay actor:

```text
Lisa, the store assistant
```

Mila's role:

```text
Coach, hint giver, reviewer.
Mila is not Lisa and should not be the shop assistant.
```

## Current Tech Stack

Keep this exact stack:

```text
Expo React Native
React Native StyleSheet
AsyncStorage
TypeScript
```

Do not add:

```text
backend
Supabase
Deepgram
AI APIs
new UI libraries
heavy animation libraries
server state
```

Package scripts:

```text
npm run typecheck
npm start -- --port 8081 --clear
```

## Important Files

Main UI:

```text
D:\germany\app\App.tsx
```

Mission content:

```text
D:\germany\app\src\lesson.ts
```

Storage and duplicate mistake behavior:

```text
D:\germany\app\src\storage.ts
D:\germany\app\src\missions.ts
```

Trainer assignment helpers:

```text
D:\germany\app\src\trainer.ts
```

Source of truth docs:

```text
D:\germany\app\docs\VISION.md
D:\germany\app\docs\LEARNER_STRATEGY.md
D:\germany\app\docs\NEXT_BUILD_STEP.md
```

Assets:

```text
D:\germany\app\assets\mila\
```

## Current Required App Flow

The Android flow must stay:

```text
Today
-> Start mission
-> Notice
-> Rule
-> Recall
-> Speak
-> Roleplay
-> Review
-> Notebook
```

Done behavior:

```text
Weak word saved
Weak rule saved
Mistake saved
Later review item visible
Duplicate mistakes update existing item instead of creating copies
```

Do not break AsyncStorage persistence.

## Language Rules

This is very important.

The app should not feel German-only. The learner is A1.1.

Use:

```text
German target first
English help second
```

Good:

```text
Ich suche einen Pullover in Größe M.
English help: I am looking for a sweater in size M.
```

Bad:

```text
Only German labels everywhere
No English guidance
Dense German grammar explanations
```

Use beginner-friendly A1.1 German only. No B1/B2 vocabulary. No long grammar lectures.

## UI Direction

The app should feel:

```text
warm
calm
guided
adult enough
beginner-friendly
like a private coach
```

It should not feel:

```text
small-kid word game
German-only grammar app
button wall
flashcard toy
corporate dashboard
oversized landing page
```

Keep the existing cream/green style and bottom tabs.

Good visual direction:

```text
soft cream background
green primary action
warm paper cards
Mila visible but not huge
one obvious Start mission CTA
cards that explain the learning step
clear English help under German target
Notebook as memory/review system
```

Avoid:

```text
dot-only bottom tabs
German-only tab labels
giant 40px+ headings everywhere
huge empty vertical gaps
overly flat sterile SaaS dashboard style
too many quick action buttons above the mission
human Mila crops with visible phone UI/background artifacts
```

## Recent Failed Design Attempt: Do Not Repeat

A previous visual pass went wrong. Avoid these exact mistakes:

1. Replaced normal tabs with tiny dot tabs. This looked bad.
2. Made the app too German-only, removing helpful English guidance.
3. Made text and cards oversized on Android.
4. Used a bad cropped human Mila asset with UI artifacts still visible.
5. Made Today feel like a generic German app rather than a beginner learning coach.
6. Moved too far from the existing usable cream/green app.

If you design or patch UI, keep the learner support first.

## What A Good Today Screen Should Do

Today should communicate:

```text
Mila has prepared one mission for you.
You know exactly what to do.
Tap Start mission.
```

Suggested structure:

```text
Header: A1.1 Today / Mila prepared one guided mission
Mila mission card:
  Clothing shop mission
  Ask for a sweater in size M
  German target
  English help
  weak word chips
Primary button:
  Start mission
Secondary:
  Guided path
  Weak words
  Notebook preview
Optional trainer controls lower down
Bottom tabs:
  Today / Practice / Roleplay / Notebook
```

Do not make quick actions the main first screen. They are secondary.

## What Mission Screens Should Do

Mission screens should show one step at a time.

Steps:

```text
Notice
Rule
Recall
Speak
Roleplay
Review
```

Each step should have:

```text
small step indicator
clear title
German target or task
English help
one primary action
optional Mila hint
```

Do not add complex forms.

## Roleplay Rules

Lisa is the scene actor.

Mila stays as coach/observer:

```text
Lisa: Guten Tag! Wie kann ich Ihnen helfen?
Learner: Ich suche einen Pullover in Größe M.
Lisa: Einen Pullover in Größe M, richtig?
Mila: Good, you used einen Pullover, not eine Pullover.
```

Do not turn Mila into the shop assistant.

## Notebook Rules

Notebook should feel like memory, not just a list.

Show:

```text
review due
words
sentences
rules
mistakes fixed
source / next review
```

Keep duplicate mistake behavior. The same mistake id should update the existing item.

## Output Request For Kimi/cto.new

When designing, output one of these:

1. A screen-by-screen UI plan with exact React Native component changes.
2. A patch for `App.tsx` only.
3. A small set of extracted components under `src/components/*` plus minimal `App.tsx` changes.

Prefer small safe patches.

Do not rewrite the whole app from scratch.

Do not change storage logic.

Do not change mission IDs.

Do not add dependencies.

Do not change the first mission.

## Quality Bar

Before saying the design is done, check:

```text
npm run typecheck passes
Android opens in Expo
Today -> Start mission works
Recall accepts "einen Pullover"
Review saves to Notebook
Notebook shows word/rule/mistake/review
Bottom tabs are readable, not dots
English help is visible
Mila asset does not look broken
```

## Best Workflow

Use Kimi/cto.new for visual proposals.

Then patch the real Expo app carefully:

```text
Kimi visual idea
-> inspect diff manually
-> keep only good UI pieces
-> preserve app logic
-> npm run typecheck
-> Android screenshot
-> iterate
```

This project should become a great app by combining visual exploration with careful reasoning, not by blindly pasting generated files.
