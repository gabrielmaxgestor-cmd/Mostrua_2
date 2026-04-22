import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export const useTeamTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTeamTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
};
