// screens/HomeScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Replace with your local logo if available:
// const logo = require('../assets/logo.jpg');
const logo = { uri: 'http://googleusercontent.com/file_content/2' };

// Dashboard items - Emergency SOS removed, Lawyer Registration added
const dashboardItems = [
  { id: '1', title: 'AI Assistant', icon: 'chatbubble-ellipses-outline', screen: 'Chatbot', color: '#3498db' },
  { id: '2', title: 'Community Forum', icon: 'people-outline', screen: 'Forum', color: '#2ecc71' },
  { id: '3', title: 'File an FIR', icon: 'document-text-outline', screen: 'FIR', color: '#e74c3c' },
  { id: '4', title: 'Find Experts', icon: 'ribbon-outline', screen: 'Experts', color: '#9b59b6' },
  { id: '5', title: 'Your Rights', icon: 'book-outline', screen: 'RightsPolicies', color: '#f1c40f' },
  { id: '6', title: 'Lawyer Registration', icon: 'briefcase-outline', screen: 'LawyerRegistration', color: '#e67e22' },
];

const HomeScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const userName = user?.displayName || route.params?.userName || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0EAD6" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={logo} style={styles.logo} />
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>{userName}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              navigation.navigate('Profile', {
                userName: userName,
                userEmail: route.params?.userEmail,
                userId: user?.id,
              })
            }
          >
            <Ionicons name="person-circle" size={40} color="#0A2240" />
          </TouchableOpacity>
        </View>

        {/* --- Quick Actions Dashboard --- */}
        <View style={styles.dashboardGrid}>
          {dashboardItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.actionItem}
              onPress={() => (item.screen ? navigation.navigate(item.screen) : alert('Coming soon!'))}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EAD6',
  },
  scrollView: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  headerGreeting: {
    fontSize: 22,
    color: '#555',
  },
  headerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A2240',
  },
  profileButton: {
    padding: 5,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionIconContainer: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A2240',
    textAlign: 'center',
  },
});

export default HomeScreen;
