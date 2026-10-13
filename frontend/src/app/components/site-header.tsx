
"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function SiteHeader() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("optitrace-theme");
    const next: Theme = saved === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("optitrace-theme", next);
  }

  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="OptiTrace home">
        <span className="brand-symbol" aria-hidden="true">o<span>.</span></span>
        <span>OptiTrace</span>
      </a>

      <button
        className="mobile-menu"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? "Close −" : "Menu +"}
      </button>

      <nav
        id="site-navigation"
        className={`site-nav ${menuOpen ? "is-open" : ""}`}
        aria-label="Main navigation"
      >
        <a href="#approach" onClick={() => setMenuOpen(false)}>Approach</a>
        <a href="#playground" onClick={() => setMenuOpen(false)}>Playground</a>
        <a href="#principles" onClick={() => setMenuOpen(false)}>Principles</a>
      </nav>

      <button
        className="theme-toggle"
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <span aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </header>
  );
}
