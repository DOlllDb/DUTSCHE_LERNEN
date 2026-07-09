import { useLang } from '../../state/LangContext.js';
import styles from './LangToggle.module.css';

export function LangToggle() {
  const { uiLang, toggleLang } = useLang();

  return (
    <button className={styles.toggle} onClick={toggleLang} title="Switch interface language">
      <span className={`${styles.opt} ${uiLang === 'de' ? styles.active : ''}`}>DE</span>
      <span className={styles.sep}>/</span>
      <span className={`${styles.opt} ${uiLang === 'en' ? styles.active : ''}`}>EN</span>
    </button>
  );
}
