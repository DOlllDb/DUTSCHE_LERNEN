import { useMemo } from 'react';
import { curriculumTopics } from '@deutsch-lernen/shared';
import { useProgress } from '../../state/ProgressContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './TopicList.module.css';

interface Props {
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

/** The sidebar's "Topics" tab: every vocabulary topic in curriculum order.
 * Selecting one jumps to the first day it appears on. */
export function TopicList({ selectedDay, onSelectDay }: Props) {
  const { curriculum, progress } = useProgress();
  const { uiLang, t } = useLang();

  // 1200 words regrouped -- cheap, but no reason to redo it on every render.
  const topics = useMemo(() => (curriculum ? curriculumTopics(curriculum) : []), [curriculum]);

  if (!curriculum) return null;

  return (
    <div className={styles.list}>
      {topics.map((topic) => {
        const label = uiLang === 'en' ? topic.cat_en : topic.cat;
        const first = topic.days[0];
        const last = topic.days[topic.days.length - 1];
        const range = first === last ? String(first) : `${first}–${last}`;
        const allDaysDone = topic.days.every((d) => progress.doneDays[d]);
        // The topic whose day range contains the open day.
        const isActive = topic.days.includes(selectedDay);

        const cls = [styles.topic, isActive && styles.active, allDaysDone && styles.done]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={topic.cat}
            className={cls}
            title={t('topicGoToDay', first)}
            onClick={() => onSelectDay(first)}
          >
            <span className={styles.body}>
              <span className={styles.name}>{label}</span>
              <span className={styles.meta}>
                {t('topicMeta', range, topic.refs.length)}
              </span>
            </span>
            {allDaysDone && <span className={styles.check}>✓</span>}
          </button>
        );
      })}
    </div>
  );
}
