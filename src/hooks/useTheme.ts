import { useEffect, useState } from "react";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("cofeed-theme");
    const nextDarkMode =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDarkMode(nextDarkMode);
    document.documentElement.classList.toggle("dark", nextDarkMode);
    document.documentElement.dataset.theme = nextDarkMode ? "dark" : "light";
  }, []);

  function toggleTheme() {
    setIsDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.dataset.theme = next ? "dark" : "light";
      localStorage.setItem("cofeed-theme", next ? "dark" : "light");
      return next;
    });
  }

  return { isDarkMode, toggleTheme };
}
