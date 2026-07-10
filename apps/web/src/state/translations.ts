export type UiLang = 'de' | 'en';

type Entry<T> = { de: T; en: T };

export const T = {
  brandEyebrow: { de: '1200 Wörter · 60 Tage', en: '1200 words · 60 days' },
  titleHtml: { de: 'Deutsch <em>lernen</em>', en: 'Learn <em>German</em>' },
  lblDays: { de: 'Tage geschafft', en: 'Days done' },
  lblWords: { de: 'Wörter gelernt', en: 'Words learned' },
  lblTests: { de: 'Tests bestanden', en: 'Tests passed' },
  footer: {
    de: 'Jeden Tag 20 neue Wörter · Alle 7 Tage ein Wiederholungstest · Fortschritt wird automatisch gespeichert',
    en: '20 new words every day · A review test every 7 days · Progress is saved automatically',
  },
  weekLabel: { de: 'Woche', en: 'Week' },
  practiceTestButton: { de: 'Übungstest', en: 'Practice test' },
  practiceTestTitle: { de: 'Übungstest', en: 'Practice test' },
  practiceTestIntro: {
    de: (n: number) => `Teste dich mit allen ${n} bisher gelernten Wörtern, in der Richtung deiner Wahl.`,
    en: (n: number) => `Test yourself with all ${n} words you've learned so far, in whichever direction you like.`,
  },
  practiceTestEmpty: {
    de: 'Du hast noch keine Tage abgeschlossen. Schließe zuerst einen Tag ab, um hier üben zu können.',
    en: "You haven't completed any days yet. Finish a day first to practice here.",
  },
  directionLabel: { de: 'Richtung', en: 'Direction' },
  directionDeEn: { de: 'Deutsch → Englisch', en: 'German → English' },
  directionEnDe: { de: 'Englisch → Deutsch', en: 'English → German' },
  directionMixed: { de: 'Gemischt', en: 'Mixed' },
  practiceAgain: { de: 'Nochmal üben', en: 'Practice again' },
  donePracticing: { de: 'Fertig', en: 'Done' },
  backToApp: { de: '← Zurück', en: '← Back' },
  legendDone: { de: 'erledigt', en: 'done' },
  legendTest: { de: '★ Test-Tag', en: '★ Test day' },
  exportBtn: { de: 'Fortschritt speichern', en: 'Save progress' },
  importBtn: { de: 'Fortschritt laden', en: 'Load progress' },
  savingIndicator: { de: 'Speichere …', en: 'Saving …' },
  savedIndicator: { de: 'Automatisch gespeichert', en: 'Saved automatically' },
  saveErrorIndicator: {
    de: 'Fehler beim Speichern — Verbindung prüfen',
    en: 'Save failed — check your connection',
  },
  importInvalid: {
    de: 'Diese Datei sieht nicht wie eine gültige Fortschrittsdatei aus.',
    en: "This file doesn't look like a valid progress file.",
  },
  importFailed: { de: 'Die Datei konnte nicht gelesen werden.', en: 'The file could not be read.' },
  modeCards: { de: 'Karteikarten', en: 'Flashcards' },
  modeList: { de: 'Alle Wörter', en: 'All words' },
  modeQuiz: { de: 'Wochentest →', en: 'Weekly test →' },
  testDayHint: {
    de: (n: number, range: string) =>
      `Lerne zuerst die ${n} neuen Wörter von heute. Der Test danach prüft alle Wörter der Tage ${range}.`,
    en: (n: number, range: string) =>
      `First learn today's ${n} new words. The test afterward covers all words from days ${range}.`,
  },
  dayTag: { de: (n: number) => `Tag ${n} von 60`, en: (n: number) => `Day ${n} of 60` },
  testTagSuffix: { de: ' · Test-Tag', en: ' · Test day' },
  newWordsPill: { de: (n: number) => `${n} neue Wörter`, en: (n: number) => `${n} new words` },
  poolPill: { de: (n: number) => `${n} Wörter im Pool`, en: (n: number) => `${n} words in pool` },
  markDone: { de: 'Tag als gelernt markieren', en: 'Mark day as learned' },
  markedDone: {
    de: 'Tag als erledigt markiert ✓ (klicken zum Entfernen)',
    en: 'Marked as done ✓ (click to unmark)',
  },
  prevBtn: { de: '← Zurück', en: '← Back' },
  nextBtn: { de: 'Weiter →', en: 'Next →' },
  learningBtn: { de: 'Noch am Lernen', en: 'Still learning' },
  knowBtn: { de: 'Ich kenne es ✓', en: 'I know it ✓' },
  flipHintFront: { de: 'Tippen zum Umdrehen', en: 'Tap to flip' },
  flipHintBack: { de: 'Tippen zum Zurückdrehen', en: 'Tap to flip back' },
  translationLbl: { de: 'Übersetzung', en: 'Translation' },
  quizReady: { de: 'Bereit für den Test?', en: 'Ready for the test?' },
  quizIntro: {
    de: (range: string) =>
      `Dieser Test prüft die Wörter aus den Tagen ${range}. Du bekommst 20 Multiple-Choice-Fragen, gemischt zwischen Deutsch→Englisch und Englisch→Deutsch.`,
    en: (range: string) =>
      `This test covers the words from days ${range}. You'll get 20 multiple-choice questions, mixed between German→English and English→German.`,
  },
  lastScore: { de: 'Letztes Ergebnis:', en: 'Last score:' },
  startQuiz: { de: 'Test starten', en: 'Start test' },
  backToCards: { de: '← Zurück zu den Karteikarten', en: '← Back to flashcards' },
  qCount: { de: (i: number, n: number) => `Frage ${i} von ${n}`, en: (i: number, n: number) => `Question ${i} of ${n}` },
  promptDeEn: { de: 'Was bedeutet dieses Wort?', en: 'What does this word mean?' },
  promptEnDe: { de: 'Wie heißt das auf Deutsch?', en: "What's this in German?" },
  resultLine: {
    de: (pct: number, good: boolean) =>
      `${pct}% richtig — ${good ? 'Stark! Diese Woche sitzt.' : 'Gut gemacht. Wiederhole ein paar Karten und versuch es nochmal.'}`,
    en: (pct: number, good: boolean) =>
      `${pct}% correct — ${good ? "Great! You've got this week down." : 'Good effort. Review a few cards and try again.'}`,
  },
  retryQuiz: { de: 'Nochmal versuchen', en: 'Try again' },
  markTestDone: { de: 'Test als bestanden markieren', en: 'Mark test as passed' },
  reviewCorrect: { de: '✓ ', en: '✓ ' },
  reviewWrongPrefix: { de: '✗ ', en: '✗ ' },
  reviewWrongMid: { de: ' (richtig: ', en: ' (correct: ' },
  hideDeOff: { de: 'Deutsch verbergen', en: 'Hide German' },
  hideDeOn: { de: 'Deutsch anzeigen', en: 'Show German' },
  hideEnOff: { de: 'Englisch verbergen', en: 'Hide English' },
  hideEnOn: { de: 'Englisch anzeigen', en: 'Show English' },
  revealAll: { de: 'Alle aufdecken', en: 'Reveal all' },
  selfTestHintDe: {
    de: 'Selbsttest: Die deutschen Wörter sind verborgen. Klicke auf ein Wort, um es aufzudecken.',
    en: 'Self-test: the German words are hidden. Click a word to reveal it.',
  },
  selfTestHintEn: {
    de: 'Selbsttest: Die englischen Wörter sind verborgen. Klicke auf ein Wort, um es aufzudecken.',
    en: 'Self-test: the English words are hidden. Click a word to reveal it.',
  },
} satisfies Record<string, Entry<string> | Entry<(...args: never[]) => string>>;

export type TKey = keyof typeof T;
