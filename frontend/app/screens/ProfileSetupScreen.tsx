// src/screens/ProfileSetupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { User, GraduationCap, Code, ArrowRight, X } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from 'App';


type ProfileSetupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'>;
};

export default function ProfileSetupScreen({
  navigation,
}: ProfileSetupScreenProps) {
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [projectInterest, setProjectInterest] = useState('');
  const [workStyle, setWorkStyle] = useState('balanced');
  const [availability, setAvailability] = useState('parttime');
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleContinue = async () => {
    if (!department) {
      Alert.alert('Error', 'Please select your department');
      return;
    }

    if (skills.length === 0) {
      Alert.alert('Error', 'Please add at least one skill');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        department,
        bio: bio || 'Hey there! Looking for a project partner.',
        skills,
        interests: interests.length > 0 ? interests : [projectInterest],
        work_style: { preference: workStyle },
        looking_for: projectInterest || 'Exciting projects',
        availability,
        project_types: projectInterest ? [projectInterest] : ['web'],
      };

      await apiService.updateProfile(profileData);

      // Mark profile as completed
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.profile_completed = true;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      // Reset navigation to Main screen

    navigation.replace('Main');
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Profile</Text>
          <Text style={styles.subtitle}>Let others know who you are</Text>
        </View>

        <View style={styles.form}>
          {/* Department */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Department *</Text>
            <View style={styles.pickerWrapper}>
              <GraduationCap
                size={20}
                color="#9CA3AF"
                style={styles.inputIconAbsolute}
              />
              <Picker
                selectedValue={department}
                onValueChange={setDepartment}
                style={styles.picker}
                dropdownIconColor="#6C63FF"
              >
                <Picker.Item label="Select your department" value="" />
                <Picker.Item label="Computer Science" value="Computer Science" />
                <Picker.Item
                  label="Electrical Engineering"
                  value="Electrical Engineering"
                />
                <Picker.Item
                  label="Mechanical Engineering"
                  value="Mechanical Engineering"
                />
                <Picker.Item
                  label="Civil Engineering"
                  value="Civil Engineering"
                />
                <Picker.Item
                  label="Chemical Engineering"
                  value="Chemical Engineering"
                />
                <Picker.Item label="Business" value="Business" />
                <Picker.Item label="Design" value="Design" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          {/* Year */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Academic Year</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={year}
                onValueChange={setYear}
                style={styles.picker}
                dropdownIconColor="#6C63FF"
              >
                <Picker.Item label="Select your year" value="" />
                <Picker.Item label="1st Year" value="1" />
                <Picker.Item label="2nd Year" value="2" />
                <Picker.Item label="3rd Year" value="3" />
                <Picker.Item label="4th Year" value="4" />
                <Picker.Item label="Graduate" value="grad" />
              </Picker>
            </View>
          </View>

          {/* Bio */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>About Me</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell others about yourself..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>

          {/* Skills */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Skills *</Text>
            <View style={styles.inputWrapper}>
              <Code size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Type a skill and press Add"
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity
                onPress={addSkill}
                style={styles.addButton}
                disabled={!skillInput.trim()}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {skills.length > 0 && (
              <View style={styles.skillsContainer}>
                {skills.map((skill, index) => (
                  <View key={index} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                    <TouchableOpacity onPress={() => removeSkill(skill)}>
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Project Interest */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Project Interests</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={projectInterest}
                onValueChange={setProjectInterest}
                style={styles.picker}
                dropdownIconColor="#6C63FF"
              >
                <Picker.Item label="What interests you?" value="" />
                <Picker.Item label="Web Development" value="Web Development" />
                <Picker.Item label="Mobile Apps" value="Mobile Apps" />
                <Picker.Item label="Machine Learning" value="Machine Learning" />
                <Picker.Item label="IoT & Hardware" value="IoT & Hardware" />
                <Picker.Item label="Research Projects" value="Research Projects" />
                <Picker.Item label="Game Development" value="Game Development" />
                <Picker.Item label="Data Science" value="Data Science" />
              </Picker>
            </View>
          </View>

          {/* Work Style */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Work Style</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'leader', label: 'Leader - I like to take charge' },
                {
                  value: 'balanced',
                  label: 'Balanced - I adapt to the situation',
                },
                { value: 'supporter', label: 'Supporter - I prefer to assist' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    workStyle === option.value && styles.radioOptionSelected,
                  ]}
                  onPress={() => setWorkStyle(option.value)}
                >
                  <View style={styles.radio}>
                    {workStyle === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Availability */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Availability</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={availability}
                onValueChange={setAvailability}
                style={styles.picker}
                dropdownIconColor="#6C63FF"
              >
                <Picker.Item
                  label="Full-time (20+ hrs/week)"
                  value="Full-time"
                />
                <Picker.Item
                  label="Part-time (10-20 hrs/week)"
                  value="Part-time"
                />
                <Picker.Item
                  label="Casual (Less than 10 hrs/week)"
                  value="Casual"
                />
              </Picker>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  form: {
    gap: 24,
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
  inputIconAbsolute: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  picker: {
    flex: 1,
    height: Platform.OS === 'ios' ? 180 : 56,
    marginLeft: Platform.OS === 'android' ? 24 : 0,
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter-Regular',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  skillText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  radioOptionSelected: {
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C63FF',
  },
  radioLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1F1F1F',
    fontFamily: 'Inter-Regular',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    backgroundColor: '#6C63FF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
});