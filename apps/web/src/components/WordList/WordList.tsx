import { useState } from 'react';
import type { Day } from '@deutsch-lernen/shared';
import { useLang } from '../../state/LangContext.js';
import styles from './WordList.module.css';

interface Props {
  day: Day;
  doneAlready: boolean;
  onToggleDone: () => void;
}

type HideMode = 'none' | 'de' | 'en';

export function WordList({ day, doneAlready, onToggleDone }: Props) {
  const [hideMode, setHideMode] = useState<HideMode>('none');
  const [revealedDe, setRevealedDe] = useState<Set<number>>(new Set());
  const [revealedEn, setRevealedEn] = useState<Set<number>>(new Set());
  const { t } = useLang();

  function toggleHide(mode: 'de' | 'en') {
    setHideMode((prev) => (prev === mode ? 'none' : mode));
    setRevealedDe(new Set());
    setRevealedEn(new Set());
  }

  function revealAll() {
    if (hideMode === 'de') setRevealedDe(new Set(day.words.map((_, i) => i)));
    else if (hideMode === 'en') setRevealedEn(new Set(day.words.map((_, i) => i)));
  }

  return (
    <>
      <div className={styles.hideToggle}>
        <button className={`btn ${hideMode === 'de' ? 'active-hide' : 'ghost'}`} onClick={() => toggleHide('de')}>
          {hideMode === 'de' ? t('hideDeOn') : t('hideDeOff')}
        </button>
        <button className={`btn ${hideMode === 'en' ? 'active-hide' : 'ghost'}`} onClick={() => toggleHide('en')}>
          {hideMode === 'en' ? t('hideEnOn') : t('hideEnOff')}
        </button>
        {hideMode !== 'none' && (
          <button className="btn ghost" onClick={revealAll}>
            {t('revealAll')}
          </button>
        )}
      </div>

      {hideMode === 'de' && <div className={styles.selftestHint}>{t('selfTestHintDe')}</div>}
      {hideMode === 'en' && <div className={styles.selftestHint}>{t('selfTestHintEn')}</div>}

      <div className={styles.wordlist}>
        {day.words.map((word, i) => {
          const deMasked = hideMode === 'de' && !revealedDe.has(i);
          const enMasked = hideMode === 'en' && !revealedEn.has(i);
          return (
            <div key={i} className={styles.wlItem}>
              <span
                className={`${styles.wlDe} ${deMasked ? styles.maskedWord : ''}`}
                onClick={() => deMasked && setRevealedDe((prev) => new Set(prev).add(i))}
              >
                {word.de}
              </span>
              <span
                className={`${styles.wlEn} ${enMasked ? styles.maskedWord : ''}`}
                onClick={() => enMasked && setRevealedEn((prev) => new Set(prev).add(i))}
              >
                {word.en}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className={`btn ${doneAlready ? 'ghost' : 'primary'}`} onClick={onToggleDone}>
          {doneAlready ? t('markedDone') : t('markDone')}
        </button>
      </div>
    </>
  );
}
