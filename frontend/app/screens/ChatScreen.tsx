// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react-native';
import { apiService } from '../services/api';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: number;
    full_name: string;
    profile_photo_url: string | null;
  };
}

interface ChatScreenProps {
  route: {
    params: {
      matchId: number;
      otherUser: {
        id: number;
        full_name: string;
        profile_photo_url: string | null;
      };
    };
  };
  navigation: any;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { matchId, otherUser } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    loadCurrentUser();
    // Set up polling for new messages
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        setCurrentUserId(response.user.id);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await apiService.getMessages(matchId);
      if (response.messages) {
        setMessages(response.messages.reverse());
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;

    const tempMessage = messageText;
    setMessageText('');
    setSending(true);

    try {
      const response = await apiService.sendMessage(matchId, tempMessage);
      if (response.success) {
        setMessages((prev) => [...prev, response.data]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      setMessageText(tempMessage);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {formatTime(item.created_at)}
          </Text>
        </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#1F1F1F" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Image
            source={{
              uri: otherUser.profile_photo_url || 'https://via.placeholder.com/40',
            }}
            style={styles.avatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{otherUser.full_name}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#1F1F1F" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Start the conversation! Say hi to {otherUser.full_name} 👋
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Send size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F1F',
    fontFamily: 'Poppins-SemiBold',
  },
  headerStatus: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    fontFamily: 'Inter-Regular',
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '75%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#1F1F1F',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});