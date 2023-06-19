const classList = document.documentElement.classList;
const APPEARANCE_KEY = 'appearance';

const setClassList = (isDark = false) => {
  if (isDark) {
    classList.add('dark');
  } else {
    classList.remove('dark');
  }
};

const updateAppearance = () => {
  const userAppearance = localStorage.getItem(APPEARANCE_KEY);
  setClassList(userAppearance === 'dark');
};

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  updateAppearance();
  window.addEventListener('storage', updateAppearance);
}
export function toggle() {
  if (classList.contains('dark')) {
    setClassList(false);
    localStorage.setItem(APPEARANCE_KEY, 'light');
  } else {
    setClassList(true);
    localStorage.setItem(APPEARANCE_KEY, 'dark');
  }
}
