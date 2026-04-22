import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { TEAMS, Team } from './teamColors';

interface ThemeContextProps {
  activeTeam: Team;
  setTeam: (id: string) => void;
  teams: Team[];
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [activeTeam, setActiveTeam] = useState<Team>(TEAMS[0]);

  const setTeam = (id: string) => {
    const team = TEAMS.find(t => t.id === id);
    if (team) setActiveTeam(team);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', activeTeam.colors.primaryColor);
    root.style.setProperty('--theme-secondary', activeTeam.colors.secondaryColor);
    root.style.setProperty('--theme-gradient', activeTeam.colors.gradient);
    root.style.setProperty('--theme-text', activeTeam.colors.textColor);
  }, [activeTeam]);

  return (
    <ThemeContext.Provider value={{ activeTeam, setTeam, teams: TEAMS }}>
      {/* 
        Container de Transição Global:
        Adiciona a propriedade originária de "transição suave ao trocar de time".
        Como as CSS Vars mudam no root, o background e color vão transitar devagar.
      */}
      <div 
        className="app-theme-wrapper"
        style={{
          transition: 'background-color 0.4s ease, color 0.4s ease',
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          /* Transição garantida em todos os elementos "temáticos" */
          *, *::before, *::after {
            transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease;
          }
        `}} />
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
