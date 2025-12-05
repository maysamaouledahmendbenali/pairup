// src/screens/MatchesListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {
  Search,
  Settings,
  MessageCircle,
  Heart,
  MoreVertical,
} from 'lucide-react-native';
import { apiService } from '../services/api';

interface Match {
  id: number;
  user: {
    id: number;
    full_name: string;
    profile_photo_url: string | null;
    department: string;
    last_seen: string | null;
  };
  compatibility_score: number;
  matched_at: string;
  last_message?: {
    id: number;
    message: string;
    message_type: string;
    created_at: string;
    is_read: boolean;
  };
  unread_count: number;
}

export default function MatchesListScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'messages' | 'new'>('messages');
  const [matches, setMatches] = useState<Match[]>([]);
  const [newMatches, setNewMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await apiService.getMatches();
      if (response.success) {
        const allMatches = response.data.matches;
        
        // Separate new matches (no messages) from existing conversations
        const withMessages = allMatches.filter((m: Match) => m.last_message);
        const withoutMessages = allMatches.filter((m: Match) => !m.last_message);
        
        setMatches(withMessages);
        setNewMatches(withoutMessages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleOpenChat = (match: Match) => {
    navigation.navigate('Chat', {
      matchId: match.id,
      otherUser: match.user,
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredMatches = matches.filter((match) =>
    match.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNewMatches = newMatches.filter((match) =>
    match.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMatchCard = ({ item }: { item: Match }) => {
    const isOnline = item.user.last_seen
      ? new Date().getTime() - new Date(item.user.last_seen).getTime() < 300000
      : false;

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleOpenChat(item)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: item.user.profile_photo_url || 'https://via.placeholder.com/56',
            }}
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.matchName}>{item.user.full_name}</Text>
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityText}>
                  {item.compatibility_score}%
                </Text>
              </View>
            </View>
            <Text style={styles.timestamp}>
              {item.last_message
                ? formatTime(item.last_message.created_at)
                : formatTime(item.matched_at)}
            </Text>
          </View>

          <Text style={styles.department} numberOfLines={1}>
            {item.user.department}
          </Text>

          {item.last_message ? (
            <Text
              style={[
                styles.lastMessage,
                item.unread_count > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.last_message.message}
            </Text>
          ) : (
            <Text style={styles.lastMessage}>Start a conversation</Text>
          )}
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderNewMatchCard = ({ item }: { item: Match }) => {
    return (
      <TouchableOpacity
        style={styles.newMatchCard}
        onPress={() => handleOpenChat(item)}
      >
        <View style={styles.newMatchBadge}>
          <Text style={styles.newMatchBadgeText}>New Match!</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: item.user.profile_photo_url || 'https://via.placeholder.com/56',
            }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchName}>{item.user.full_name}</Text>
            <View style={styles.compatibilityBadge}>
              <Text style={styles.compatibilityText}>
                {item.compatibility_score}%
              </Text>
            </View>
          </View>

          <Text style={styles.department} numberOfLines={1}>
            {item.user.department}
          </Text>

          <Text style={styles.newMatchHint}>
            Say hi to your new match!
          </Text>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.title}>Matches</Text>
          <Text style={styles.subtitle}>
            {matches.length + newMatches.length} total matches
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search matches..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <MessageCircle
            size={20}
            color={activeTab === 'messages' ? '#2196F3' : '#9CA3AF'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'messages' && styles.activeTabText,
            ]}
          >
            Messages
          </Text>
          {matches.reduce((sum, m) => sum + m.unread_count, 0) > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {matches.reduce((sum, m) => sum + m.unread_count, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.activeTab]}
          onPress={() => setActiveTab('new')}
        >
          <Heart
            size={20}
            color={activeTab === 'new' ? '#6C63FF' : '#9CA3AF'}
          />
          <Text
            style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}
          >
            New
          </Text>
          {newMatches.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#6C63FF' }]}>
              <Text style={styles.tabBadgeText}>{newMatches.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={
          activeTab === 'messages' ? filteredMatches : filteredNewMatches
        }
        renderItem={
          activeTab === 'messages' ? renderMatchCard : renderNewMatchCard
        }
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              {activeTab === 'messages' ? (
                <MessageCircle size={48} color="#D1D5DB" />
              ) : (
                <Heart size={48} color="#D1D5DB" />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'messages' ? 'No Messages Yet' : 'No New Matches'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'messages'
                ? 'Start conversations with your matches'
                : 'Keep swiping to find more matches'}
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    marginHorizontal: 24,
    marginVertical: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    marginHorizontal: 24,
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Inter-SemiBold',
  },
  activeTabText: {
    color: '#2196F3',
  },
  tabBadge: {
    backgroundColor: '#2196F3',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newMatchCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF6584',
    position: 'relative',
  },
  newMatchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6584',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  newMatchBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6584',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  matchInfo: {
    flex: 1,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
    fontFamily: 'Inter-SemiBold',
  },
  compatibilityBadge: {
    backgroundColor: '#E8E6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compatibilityText: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  department: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  lastMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  unreadMessage: {
    color: '#1F1F1F',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  newMatchHint: {
    fontSize: 14,
    color: '#FF6584',
    fontStyle: 'italic',
    fontFamily: 'Inter-Regular',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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