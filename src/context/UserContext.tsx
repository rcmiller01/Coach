import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
}

interface UserContextType {
    user: User | null;
    userId: string | null;
    login: (username: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const storedUserId = localStorage.getItem('coach_user_id');
        const storedUsername = localStorage.getItem('coach_username');

        if (storedUserId && storedUsername) {
            setUser({ id: storedUserId, username: storedUsername });
        }
        setIsLoading(false);
    }, []);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

    const login = async (username: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) throw new Error('Login failed');

            const { data } = await response.json();
            setUser(data);
            localStorage.setItem('coach_user_id', data.id);
            localStorage.setItem('coach_username', data.username);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('coach_user_id');
        localStorage.removeItem('coach_username');
    };

    return (
        <UserContext.Provider value={{ user, userId: user?.id || null, login, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
