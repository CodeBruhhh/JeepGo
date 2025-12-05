import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface NavigationContextType {
  showBar: boolean;
  setShowBar: (show: boolean) => void;
  headerRef: React.RefObject<{ hideHeader: () => void; showHeader: () => void }>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showBar, setShowBar] = useState(true);
  const headerRef = useRef<{ hideHeader: () => void; showHeader: () => void }>(null);

  return (
    <NavigationContext.Provider value={{ showBar, setShowBar, headerRef }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};

