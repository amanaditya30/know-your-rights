import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const AuthContext = createContext();

// 2. Create a custom hook to make it easy to use the context in other components
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Create the Provider component. 
// Note the 'export' keyword which makes it a named export.
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // This function will be called from your Login/Signup screen on success
    const login = (userData) => {
        setUser(userData);
    };

    // This function can be called to log the user out
    const logout = () => {
        setUser(null);
    };

    // The value object holds the state and functions that will be available to the rest of the app
    const value = {
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};