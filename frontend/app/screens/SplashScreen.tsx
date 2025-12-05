// src/screens/SplashScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type SplashScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: SplashScreenProps) {
  return (
    <LinearGradient
      colors={['#6C63FF', '#8B84FF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Heart size={80} color="white" fill="white" />
        </View>
        
        <Text style={styles.title}>PairUp</Text>
        
        <Text style={styles.subtitle}>
          Find your perfect project partner.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 80,
    padding: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 48,
  },
  button: {
    backgroundColor: 'white',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#6C63FF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});