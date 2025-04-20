import React, { useEffect, useState } from 'react';
import CompoundInterestCalculator from './CompoundInterestCalculator.jsx';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-indigo-600 text-white p-4 text-center text-xl font-bold relative">
        Compound Interest Calculator App
      </header>

      <main className="flex-grow bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-6 space-y-6">
        <CompoundInterestCalculator />
      </main>

      <footer className="bg-gray-200 dark:bg-gray-800 text-center p-4 text-sm text-gray-700 dark:text-gray-300">
        © 2025 Anuj52 — All rights reserved. |
        <a
          href="https://github.com/Anuj52"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
        >
          GitHub
        </a>
      </footer>

    </div>
  );
}

export default App;