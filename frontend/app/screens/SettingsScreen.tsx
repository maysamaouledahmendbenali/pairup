// app/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Edit,
  LogOut,
  User,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import type { User as UserType } from '../services/api';

interface UserProfile extends UserType {
  profile?: {
    skills: string[];
  };
}

export default function SettingsScreen({ navigation }: any) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.logout();
            // Force app to re-check auth status
            // The app will automatically navigate to login
          } catch (error) {
            console.error('Logout error:', error);
            // Clear local storage even if API fails
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user');
          }
        },
      },
    ]);
  };

  // Placeholder for Edit Profile (coming soon)
  const handleEditProfile = () => {
    Alert.alert(
      'Coming Soon',
      'Edit profile feature will be available in the next update!'
    );
  };

  // Placeholder for other features
  const handleComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} feature will be available soon!`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Profile */}
      <LinearGradient
        colors={['#6C63FF', '#8B84FF']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri: user?.profile_photo_url || 'https://via.placeholder.com/80',
              }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name}</Text>
              <Text style={styles.profileDepartment}>
                {user?.department} • {user?.email?.split('@')[0]}
              </Text>
            </View>
          </View>

          {user?.profile?.skills && user.profile.skills.length > 0 && (
            <View style={styles.skills}>
              {user.profile.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Edit size={16} color="#6C63FF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Settings Sections */}
      <View style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<User size={20} color="#6C63FF" />}
              title="Personal Information"
              subtitle="Update your details"
              onPress={() => handleComingSoon('Personal Information')}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<Bell size={20} color="#FF6584" />}
              title="Notifications"
              subtitle="Manage your alerts"
              onPress={() => handleComingSoon('Notifications')}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<HelpCircle size={20} color="#4CAF50" />}
              title="Help Center"
              subtitle="Get support"
              onPress={() => handleComingSoon('Help Center')}
            />
            <View style={styles.separator} />
            <MenuItem
              icon={<Shield size={20} color="#FF9800" />}
              title="Privacy & Safety"
              subtitle="Control your data"
              onPress={() => handleComingSoon('Privacy & Safety')}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF6584" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PairUp v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function MenuItem({ icon, title, subtitle, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 24,
    fontFamily: 'Poppins-Bold',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    backdropFilter: 'blur(10px)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  profileDepartment: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  skillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    height: 48,
    borderRadius: 16,
    gap: 8,
  },
  editButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 8,
    fontFamily: 'Inter-SemiBold',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F1F1F',
    marginBottom: 2,
    fontFamily: 'Inter-Medium',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 76,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6584',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#FF6584',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    fontFamily: 'Inter-Regular',
  },
});