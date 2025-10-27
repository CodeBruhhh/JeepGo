import React, { createContext, ReactNode, useContext, useState } from 'react';

interface RideButtonContextType {
  showRideButton: boolean;
  setShowRideButton: (show: boolean) => void;
}

const RideButtonContext = createContext<RideButtonContextType | undefined>(undefined);

export const RideButtonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showRideButton, setShowRideButton] = useState(true);

  return (
    <RideButtonContext.Provider value={{ showRideButton, setShowRideButton }}>
      {children}
    </RideButtonContext.Provider>
  );
};

export const useRideButton = () => {
  const context = useContext(RideButtonContext);
  if (context === undefined) {
    throw new Error('useRideButton must be used within a RideButtonProvider');
  }
  return context;
};
