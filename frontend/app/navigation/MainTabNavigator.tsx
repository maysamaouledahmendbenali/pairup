// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Heart, MessageCircle, User } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import MatchFeedScreen from '../screens/MatchFeedScreen';
import LikesScreen from '../screens/LikesScreen';
import MatchesListScreen from '../screens/MatchesListScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type MainTabParamList = {
  Home: undefined;
  Likes: undefined;
  Matches: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={MatchFeedScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: '#E8E6FF' },
              ]}
            >
              <Home size={24} color={color} fill={focused ? color : 'none'} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Likes"
        component={LikesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: '#FFE8ED' },
              ]}
            >
              <Heart size={24} color={color} fill={focused ? color : 'none'} />
            </View>
          ),
          tabBarBadge: 4,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesListScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: '#E3F2FD' },
              ]}
            >
              <MessageCircle
                size={24}
                color={color}
                fill={focused ? color : 'none'}
              />
            </View>
          ),
          tabBarBadge: 3,
          tabBarBadgeStyle: { ...styles.badge, backgroundColor: '#2196F3' },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: '#E8F5E9' },
              ]}
            >
              <User size={24} color={color} fill={focused ? color : 'none'} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  badge: {
    backgroundColor: '#FF6584',
    fontSize: 10,
    fontWeight: '600',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    top: 5,
  },
});