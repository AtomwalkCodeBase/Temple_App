// src/navigation/AuthNavigator.js
// Local-only screen switching between Register and Login (no AuthContext).
import React, { useState } from 'react';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';

export default function AuthNavigator({ onAuthenticated }) {
    const [screen, setScreen] = useState('register'); // 'register' | 'login'

    if (screen === 'login') {
        return (
            <LoginScreen
                onLoggedIn={onAuthenticated}
                onGoToRegister={() => setScreen('register')}
            />
        );
    }

    return (
        <RegisterScreen
            onRegistered={onAuthenticated}
            onGoToLogin={() => setScreen('login')}
        />
    );
}
