import { useState } from 'react';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import { Flashcard } from '../Flashcard/Flashcard.js';
import { WordList } from '../WordList/WordList.js';
import { Quiz } from '../Quiz/Quiz.js';
import styles from './DayView.module.css';

interface Props {
  dayNum: number;
}

type ViewMode = 'cards' | 'list' | 'quiz';

export function DayView({ dayNum }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  // Lives here (not inside Flashcard) so it survives switching to list/quiz
  // mode and back. Resets naturally because AppShell keys this whole
  // component by day, so a day change remounts it -- a mode toggle doesn't.
  const [cardIndex, setCardIndex] = useState(0);
  const { curriculum, progress, toggleDayDone } = useProgress();
  const { t, dayTitle } = useLang();

  if (!curriculum) return null;
  const day = curriculum.days.find((d) => d.day === dayNum);
  if (!day) return null;

  const isTestDay = curriculum.test_days.includes(dayNum);
  const doneAlready = !!progress.doneDays[dayNum];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <div className={styles.dayTag}>
            {t('dayTag', day.day)}
            {isTestDay ? t('testTagSuffix') : ''}
          </div>
          <div className={styles.dayTopic}>{dayTitle(day)}</div>
        </div>
        <div className={styles.wordCountPill}>{t('newWordsPill', day.words.length)}</div>
      </div>

      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeBtn} ${viewMode === 'cards' ? styles.active : ''}`}
          onClick={() => setViewMode('cards')}
        >
          {t('modeCards')}
        </button>
        <button
          className={`${styles.modeBtn} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => setViewMode('list')}
        >
          {t('modeList')}
        </button>
        {isTestDay && (
          <button
            className={`${styles.modeBtn} ${viewMode === 'quiz' ? styles.active : ''}`}
            onClick={() => setViewMode('quiz')}
          >
            {t('modeQuiz')}
          </button>
        )}
      </div>

      {isTestDay && viewMode !== 'quiz' && (
        <div className={styles.testDayHint}>
          {t('testDayHint', day.words.length, testRangeLabel(curriculum.test_days, day.day))}
        </div>
      )}

      {viewMode === 'cards' && (
        <Flashcard
          day={day}
          doneAlready={doneAlready}
          onToggleDone={() => toggleDayDone(day.day)}
          cardIndex={cardIndex}
          onCardIndexChange={setCardIndex}
        />
      )}
      {viewMode === 'list' && (
        <WordList day={day} doneAlready={doneAlready} onToggleDone={() => toggleDayDone(day.day)} />
      )}
      {viewMode === 'quiz' && isTestDay && (
        <Quiz day={day} curriculum={curriculum} onBackToCards={() => setViewMode('cards')} />
      )}
    </div>
  );
}

function testRangeLabel(testDays: number[], day: number): string {
  const idx = testDays.indexOf(day);
  const prevTest = idx > 0 ? testDays[idx - 1] : 0;
  return `${prevTest + 1}–${day}`;
}
