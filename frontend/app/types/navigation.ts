// app/types/navigation.ts
// Central location for all navigation types

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// Root Stack (Auth + Main)
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

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Likes: undefined;
  Matches: undefined;
  Profile: undefined;
};

// Navigation Props for each screen
export type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

export type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export type ProfileSetupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProfileSetup'
>;

export type ChatScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Chat'
>;

// Composite navigation for tab screens (can navigate to Chat)
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type MatchesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Matches'>,
  NativeStackNavigationProp<RootStackParamList>
>;