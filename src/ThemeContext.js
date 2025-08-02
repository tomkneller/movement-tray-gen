import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light-mode');

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark-mode)').matches;
        const initialTheme = saved ?? (systemPrefersDark ? 'dark-mode' : 'light-mode');
        setTheme(initialTheme);
        document.body.classList.toggle('dark-mode', initialTheme === 'dark-mode');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark-mode' ? 'light-mode' : 'dark-mode';
        setTheme(newTheme);
        document.body.classList.toggle('dark-mode', newTheme === 'dark-mode');
        localStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
