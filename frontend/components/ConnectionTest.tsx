// app/components/ConnectionTest.tsx
// Temporary component to test API connection
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const API_URL = 'http://192.168.0.8:8000/api'; // ⚠️ Change to YOUR IP

export default function ConnectionTest() {
  const [status, setStatus] = useState('Not tested');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing...');

    try {
      // Test 1: Basic fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/test`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus(`✅ Connected! Status: ${response.status}`);
        Alert.alert('Success', 'Backend connection working!');
      } else {
        setStatus(`⚠️ Response: ${response.status}`);
        Alert.alert('Warning', `Backend responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setStatus(`❌ Error: ${error.message}`);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Failed',
          'Cannot reach backend. Check:\n\n' +
          '1. Backend is running\n' +
          '2. You\'re using correct IP address\n' +
          '3. Phone is on same WiFi network\n' +
          '4. Firewall is not blocking connection'
        );
      } else if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Connection timed out. Backend might be slow or unreachable.');
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      <Text style={styles.url}>Testing: {API_URL}</Text>
      <Text style={styles.status}>{status}</Text>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Quick Fixes:</Text>
        <Text style={styles.tip}>1. Make sure backend is running</Text>
        <Text style={styles.tip}>2. Check your IP address (ipconfig/ifconfig)</Text>
        <Text style={styles.tip}>3. Backend should run on: php artisan serve --host=0.0.0.0</Text>
        <Text style={styles.tip}>4. Phone must be on same WiFi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 8,
  },
  url: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: '#374151',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tips: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
});