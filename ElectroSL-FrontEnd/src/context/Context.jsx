// AuthContext.jsx
import React, { createContext, useState } from 'react';
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};

// SignalRContext.jsx
import React, { createContext } from 'react';
export const SignalRContext = createContext();
export const SignalRProvider = ({ children }) => {
    // SignalR connection logic goes here
    return <SignalRContext.Provider value={{}}>{children}</SignalRContext.Provider>;
};