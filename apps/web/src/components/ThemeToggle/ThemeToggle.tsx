import { useTheme } from '../../state/ThemeContext.js';
import { useLang } from '../../state/LangContext.js';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { resolved, toggleTheme } = useTheme();
  const { t } = useLang();

  // The icon shows what you'd switch TO, matching the tooltip.
  const label = resolved === 'dark' ? t('themeToLight') : t('themeToDark');

  return (
    <button type="button" className={styles.toggle} onClick={toggleTheme} title={label} aria-label={label}>
      {resolved === 'dark' ? '☀' : '☾'}
    </button>
  );
}
