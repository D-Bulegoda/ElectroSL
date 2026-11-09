import React, { createContext } from 'react';

export const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
  // SignalR connection logic goes here
  return (
    <SignalRContext.Provider value={{}}>
      {children}
    </SignalRContext.Provider>
  );
};