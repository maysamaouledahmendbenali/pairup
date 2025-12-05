// src/screens/MatchFeedScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Heart, Settings, GraduationCap } from 'lucide-react-native';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface Profile {
  id: number;
  full_name: string;
  profile_photo_url: string | null;
  department: string;
  bio: string;
  profile?: {
    skills: string[];
    interests: string[];
    availability: string;
    looking_for: string;
  };
}

export default function MatchFeedScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await apiService.discoverUsers({ limit: 20 });
      if (response.success) {
        setProfiles(response.data.users);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    
    try {
      const response = await apiService.swipe(profile.id, action);
      
      if (response.data?.match) {
        Alert.alert(
          "It's a Match! 🎉",
          `You matched with ${profile.full_name}! Start chatting now.`,
          [
            { text: 'Keep Swiping', style: 'cancel' },
            { text: 'Send Message', onPress: () => {/* Navigate to chat */} },
          ]
        );
      }
      
      // Move to next profile
      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Load more profiles
        loadProfiles();
        setCurrentIndex(0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process swipe');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No More Profiles</Text>
        <Text style={styles.emptyText}>
          Check back later for new matches!
        </Text>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={loadProfiles}
        >
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = profiles[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>
            Find your perfect project partner
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Profile Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: profile.profile_photo_url || 'https://via.placeholder.com/400',
              }}
              style={styles.image}
            />
            <View style={styles.gradient} />

            {/* Match Badge */}
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>
                {Math.floor(Math.random() * 20 + 80)}% Match
              </Text>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {profile.full_name}
              </Text>
              <View style={styles.departmentContainer}>
                <GraduationCap size={16} color="white" />
                <Text style={styles.department}>
                  {profile.department}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.details}>
            {/* Skills */}
            {profile.profile?.skills && profile.profile.skills.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Top Skills</Text>
                <View style={styles.skillsContainer}>
                  {profile.profile.skills.slice(0, 3).map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bio */}
            {profile.bio && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>About</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}

            {/* Interests */}
            {profile.profile?.looking_for && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Looking For</Text>
                <Text style={styles.bioText}>
                  {profile.profile.looking_for}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.passButton}
            onPress={() => handleSwipe('pass')}
          >
            <X size={32} color="#FF6584" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleSwipe('like')}
          >
            <Heart size={40} color="white" fill="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  reloadButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
  },
  reloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1F1F',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  matchBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C63FF',
    fontFamily: 'Poppins-Bold',
  },
  profileInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  departmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  department: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
  },
  details: {
    padding: 24,
    gap: 16,
  },
  detailSection: {
    gap: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#E8E6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 14,
    color: '#6C63FF',
    fontFamily: 'Inter-Medium',
  },
  bioText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 32,
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  likeButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});