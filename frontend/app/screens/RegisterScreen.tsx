// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
;
import { User, Mail, Lock, Chrome } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../_layout';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.register({
        full_name: fullName,
        email: email,
        password: password,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        apiService.setAuthToken(response.token);

        Alert.alert(
          'Success',
          'Account created successfully!',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('ProfileSetup'),
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F8F9FB', '#E8E6FF', '#FFE8ED']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join PairUp and find your perfect project partner
            </Text>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@university.edu"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity style={styles.googleButton}>
              <Chrome size={20} color="#1F1F1F" style={{ marginRight: 8 }} />
              <Text style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.loginContainer}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-Medium',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  termsLink: {
    color: '#6C63FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  button: {
    backgroundColor: '#6C63FF',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  googleButton: {
    backgroundColor: 'white',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F1F',
    fontFamily: 'Poppins-SemiBold',
  },
  loginContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    color: '#6C63FF',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});