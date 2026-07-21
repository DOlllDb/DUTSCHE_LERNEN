import { useState } from 'react';
import type { Day } from '@deutsch-lernen/shared';
import { wordKey } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './Flashcard.module.css';

interface Props {
  day: Day;
  doneAlready: boolean;
  onToggleDone: () => void;
  /** Lifted to DayView so it survives switching to another mode (list/quiz)
   * and back -- only a day change should reset this, not a mode toggle. */
  cardIndex: number;
  onCardIndexChange: (index: number) => void;
}

export function Flashcard({ day, doneAlready, onToggleDone, cardIndex, onCardIndexChange }: Props) {
  const [flipped, setFlipped] = useState(false);
  const { progress, setWordStatus } = useProgress();
  const { t, catLabel } = useLang();

  const words = day.words;
  const w = words[cardIndex];

  function advance() {
    if (cardIndex < words.length - 1) {
      onCardIndexChange(cardIndex + 1);
      setFlipped(false);
    }
  }

  return (
    <div className={styles.cardStage}>
      <div
        className={`${styles.flashcard} ${flipped ? styles.flipped : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={styles.flashcardInner}>
          <div className={`${styles.face} ${styles.front}`}>
            <div className={styles.catChip}>{catLabel(w)}</div>
            <div className={styles.wordDe}>{w.de}</div>
            <div className={styles.flipHint}>{t('flipHintFront')}</div>
          </div>
          <div className={`${styles.face} ${styles.back}`}>
            <div className={styles.catChip}>{t('translationLbl')}</div>
            <div className={styles.wordEn}>{w.en}</div>
            <div className={styles.flipHint}>{t('flipHintBack')}</div>
          </div>
        </div>
      </div>

      <div className={styles.cardControls}>
        <button
          className="btn ghost"
          disabled={cardIndex === 0}
          onClick={(e) => {
            e.stopPropagation();
            if (cardIndex > 0) {
              onCardIndexChange(cardIndex - 1);
              setFlipped(false);
            }
          }}
        >
          {t('prevBtn')}
        </button>
        <button
          className="btn learning"
          onClick={(e) => {
            e.stopPropagation();
            setWordStatus(day.day, cardIndex, 'learning');
            advance();
          }}
        >
          {t('learningBtn')}
        </button>
        <button
          className="btn know"
          onClick={(e) => {
            e.stopPropagation();
            setWordStatus(day.day, cardIndex, 'known');
            advance();
          }}
        >
          {t('knowBtn')}
        </button>
        <button
          className="btn ghost"
          disabled={cardIndex === words.length - 1}
          onClick={(e) => {
            e.stopPropagation();
            advance();
          }}
        >
          {t('nextBtn')}
        </button>
      </div>

      <div className={styles.wordDots}>
        {words.map((_, i) => {
          const status = progress.wordStatus[wordKey(day.day, i)];
          const cls = [
            styles.wdot,
            i === cardIndex && styles.current,
            status === 'known' && styles.known,
            status === 'learning' && styles.learningFlag,
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={i}
              className={cls}
              onClick={() => {
                onCardIndexChange(i);
                setFlipped(false);
              }}
            />
          );
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          className={`btn ${doneAlready ? 'ghost' : 'primary'} ${styles.dayCompleteBtn}`}
          onClick={onToggleDone}
        >
          {doneAlready ? t('markedDone') : t('markDone')}
        </button>
      </div>
    </div>
  );
}
