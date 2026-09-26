// src/navigation/AuthNavigator.js
// Local-only screen switching between Register and Login (no AuthContext).
import React, { useState } from 'react';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';

export default function AuthNavigator({ onAuthenticated }) {
    const [screen, setScreen] = useState('login'); // 'register' | 'login' | 'phoneAuth'

    if (screen === 'login') {
        return (
            <LoginScreen
                onLoggedIn={onAuthenticated}
                onGoToRegister={() => setScreen('register')}
                onGoToPhoneAuth={() => setScreen('phoneAuth')}
            />
        );
    }

    if (screen === 'phoneAuth') {
        return (
            <PhoneAuthScreen
                onLoggedIn={onAuthenticated}
                onGoToLogin={() => setScreen('login')}
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
