// src/screens/LikesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Heart, X, Star, Sparkles, Filter } from 'lucide-react-native';
import { apiService } from '../services/api';

interface LikeProfile {
  id: number;
  full_name: string;
  profile_photo_url: string | null;
  department: string;
  bio: string;
  profile?: {
    skills: string[];
    interests: string[];
  };
}

export default function LikesScreen() {
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLikes();
  }, []);

  const loadLikes = async () => {
    try {
      const response = await apiService.getSwipeHistory('received', 'like');
      if (response.success) {
        setLikes(response.data.swipes);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load likes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadLikes();
  };

  const handleSwipe = async (userId: number, action: 'like' | 'pass') => {
    try {
      const response = await apiService.swipe(userId, action);
      
      if (response.data?.match) {
        Alert.alert(
          "It's a Match! 🎉",
          'You can now start chatting!',
          [
            { text: 'Keep Browsing', style: 'cancel' },
            { text: 'Send Message', onPress: () => {/* Navigate to chat */} },
          ]
        );
      }

      // Remove from list
      setLikes(likes.filter((like) => like.id !== userId));
    } catch (error) {
      Alert.alert('Error', 'Failed to process action');
    }
  };

  const renderLikeCard = ({ item }: { item: LikeProfile }) => {
    const isBlurred = Math.random() > 0.7; // Simulate premium feature

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: item.profile_photo_url || 'https://via.placeholder.com/300',
            }}
            style={[styles.image, isBlurred && styles.blurredImage]}
            blurRadius={isBlurred ? 10 : 0}
          />
          
          {/* Gradient Overlay */}
          <View style={styles.gradient} />

          {/* Match Badge */}
          <View style={[styles.badge, isBlurred && styles.blurredBadge]}>
            <Heart size={12} color="white" />
            <Text style={styles.badgeText}>
              {Math.floor(Math.random() * 15 + 85)}%
            </Text>
          </View>

          {/* Premium Overlay */}
          {isBlurred && (
            <View style={styles.premiumOverlay}>
              <View style={styles.premiumIcon}>
                <Star size={24} color="white" />
              </View>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}

          {/* Profile Info */}
          <View style={[styles.profileInfo, isBlurred && styles.blurredInfo]}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.department}>
              {item.department}
            </Text>
            {item.profile?.skills && (
              <View style={styles.skills}>
                {item.profile.skills.slice(0, 2).map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {!isBlurred && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.passButton}
              onPress={() => handleSwipe(item.id, 'pass')}
            >
              <X size={18} color="#FF6584" />
              <Text style={styles.passButtonText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => handleSwipe(item.id, 'like')}
            >
              <Heart size={18} color="white" />
              <Text style={styles.likeButtonText}>Match</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Likes You</Text>
          <Text style={styles.subtitle}>
            {likes.length} people interested in pairing up
          </Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Premium Banner */}
      <View style={styles.premiumBanner}>
        <View style={styles.premiumIconContainer}>
          <Sparkles size={24} color="white" />
        </View>
        <View style={styles.premiumContent}>
          <Text style={styles.premiumTitle}>See Who Likes You</Text>
          <Text style={styles.premiumDescription}>
            Upgrade to PairUp Premium to see all profiles that liked you and
            match instantly!
          </Text>
          <TouchableOpacity style={styles.premiumButton}>
            <Star size={16} color="#6C63FF" />
            <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Likes Grid */}
      <FlatList
        data={likes}
        renderItem={renderLikeCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Heart size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Likes Yet</Text>
            <Text style={styles.emptyText}>
              Keep swiping! When someone likes your profile, they'll appear here.
            </Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1F1F',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBanner: {
    margin: 24,
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumContent: {
    flex: 1,
    gap: 8,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  premiumDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
  },
  premiumButtonText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  row: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    aspectRatio: 0.75,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurredImage: {
    opacity: 0.7,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6584',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  blurredBadge: {
    opacity: 0.5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  profileInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 4,
  },
  blurredInfo: {
    opacity: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  department: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  skillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  passButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6584',
    gap: 4,
  },
  passButtonText: {
    color: '#FF6584',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  likeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    gap: 4,
  },
  likeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F1F1F',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    fontFamily: 'Inter-Regular',
  },
});