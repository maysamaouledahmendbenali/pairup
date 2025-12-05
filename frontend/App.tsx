// App.tsx
import './global.css';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import SplashScreen from './app/screens/SplashScreen';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import ProfileSetupScreen from './app/screens/ProfileSetupScreen';
import ChatScreen from './app/screens/ChatScreen';

import MainTabNavigator from './app/navigation/MainTabNavigator';

// API Service
import { apiService } from './app/services/api';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: undefined;
  Main: undefined;
  Chat: {
    matchId: number;
    otherUser: {
      id: number;
      full_name: string;
      profile_photo_url: string | null;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token) {
        apiService.setAuthToken(token);
        setIsAuthenticated(true);
        
        // Check if profile is completed
        if (userStr) {
          const user = JSON.parse(userStr);
          setProfileCompleted(user.profile_completed || false);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!isAuthenticated ? (
          // Auth Flow
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !profileCompleted ? (
          // Profile Setup Flow (after login but before main app)
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          // Main App Flow
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}