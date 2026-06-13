import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        'grid h-9 w-9 place-items-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface ' +
        className
      }
    >
      <span
        className="material-symbols-outlined transition-transform duration-300"
        style={{ fontSize: 19 }}
        aria-hidden
      >
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
