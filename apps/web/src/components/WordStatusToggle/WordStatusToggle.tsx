import type { WordStatus } from '@deutsch-lernen/shared';
import { wordKey } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './WordStatusToggle.module.css';

interface Props {
  day: number;
  idx: number;
}

/**
 * Cycles a word between unmarked -> known -> still-learning -> known -> ...
 * There is deliberately no way back to unmarked once a word has been rated.
 *
 * Shared by the All-words list and the end-of-test review list so the control
 * looks and behaves identically wherever a word's status appears.
 */
export function WordStatusToggle({ day, idx }: Props) {
  const { progress, setWordStatus } = useProgress();
  const { t } = useLang();

  const status = progress.wordStatus[wordKey(day, idx)];
  const next: WordStatus = status === 'known' ? 'learning' : 'known';
  const label =
    status === 'known' ? t('statusKnown') : status === 'learning' ? t('statusLearning') : t('statusUnset');

  return (
    <button
      type="button"
      className={[styles.swatch, status === 'known' && styles.known, status === 'learning' && styles.learning]
        .filter(Boolean)
        .join(' ')}
      title={label}
      aria-label={label}
      onClick={() => setWordStatus(day, idx, next)}
    />
  );
}
