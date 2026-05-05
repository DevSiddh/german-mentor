# Next Build Step: One Polished Mila Mission

## Goal

Refine the current app into a guided Mila trainer flow, not a form/button app.

```text
Mistake -> Tiny rule -> Recall -> Speak -> Roleplay -> Save to notebook
```

Build one complete 3-5 minute A1.1 mission:

```text
Clothing shop: Ask for a sweater in size M.
```

## Mission Content

- weak word: der Pullover
- accusative: einen Pullover
- tiny rule: after suchen, masculine der becomes einen
- light dative/payment phrase: mit der Karte
- key phrase: Ich suche einen Pullover in Groesse M.
- roleplay with Lisa, the store assistant
- save weak words, weak rule, mistake, and review schedule to Notebook

## Screen Flow

### Today

- keep current UI style, mascot, colors, and bottom tabs
- show one clear daily mission card
- primary CTA: Start mission
- avoid too many buttons or free choices
- show Mila as the trainer who prepared the mission
- keep trainer commands secondary, not the first thing a beginner must choose

### Mission Practice

Replace the scattered practice flow with guided steps:

```text
Notice -> Rule -> Recall -> Speak -> Roleplay -> Review
```

Step behavior:

- Notice: Mila shows the useful sentence and weak word
- Rule: Mila explains one tiny rule, German first with English help
- Recall: learner types or selects einen Pullover
- Speak: learner practices Ich suche einen Pullover in Groesse M.
- Roleplay: learner uses it with Lisa
- Review: app saves weak word, weak rule, mistake, and next review

### Roleplay

- Lisa is the store assistant
- Mila is only the coach/hint observer
- Mila corrects gently after learner replies
- target phrase stays visible
- failed roleplay item saves as a mistake mission

### Notebook

- show weak words
- show weak rules
- show mistakes
- show review schedule
- show source: Mila mission / Roleplay / Mistake mission

## Implementation Rules

- Expo React Native only
- AsyncStorage only
- no backend
- no Supabase
- no Deepgram
- no external AI yet
- no heavy animation libraries
- keep phone-first UI
- keep cream/green style
- avoid making App.tsx much larger
- beginner-friendly A1.1 German only
- German first, English only as help
- one mission should take 3-5 minutes
- do not rebuild from scratch

Prefer extracting UI or logic when needed:

```text
src/types.ts
src/trainer.ts
src/missions.ts
src/lesson.ts
src/storage.ts
src/components/*
```

## Design-To-Code Workflow

```text
Image design board
-> Canva for vibe/assets
-> Penpot for screen layout refinement
-> Expo code implementation
-> USB Android testing
```

## Done Definition For Next Build

On Android, the learner can:

```text
Open Today
-> see one clear Mila mission
-> tap Start mission
-> complete Notice, Rule, Recall, Speak, Roleplay, Review
-> make or save the Pullover/article mistake
-> see the weak word/rule/mistake saved in Notebook
-> see the review mission due later
```

The same mistake should update the existing mission instead of creating duplicates.

## Extend Later

This mission structure should be reusable for:

- supermarket
- train station
- doctor
- apartment
- university office
- job/HR conversation
