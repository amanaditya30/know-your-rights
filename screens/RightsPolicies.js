import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#0f2027', '#203a43', '#2c5364']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome! Know Your Rights</Text>
        </View>

        {/* Navigation Cards */}
        <View style={styles.cardContainer}>
          <Card
            title="Rights & Policies"
            icon="book"
            color="#4CAF50"
            onPress={() => navigation.navigate('RightsPolicies')}
          />
          <Card
            title="Chatbot"
            icon="chatbubbles"
            color="#03A9F4"
            onPress={() => navigation.navigate('Chatbot')}
          />
          <Card
            title="File FIR"
            icon="document-text"
            color="#FFC107"
            onPress={() => navigation.navigate('FIR')}
          />
          <Card
            title="Forum"
            icon="people"
            color="#E91E63"
            onPress={() => navigation.navigate('Forum')}
          />
          <Card
            title="Legal Experts"
            icon="person-circle"
            color="#9C27B0"
            onPress={() => navigation.navigate('Experts')}
          />
          <Card
            title="Register as Lawyer"
            icon="person-add"
            color="#FF5722"
            onPress={() => navigation.navigate('LawyerRegistration')}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Reusable card component
function Card({ title, icon, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={32} color="#fff" />
      <Text style={styles.cardText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  logo: {
    width: 75,
    height: 75,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    rowGap: 20,
  },
  card: {
    width: width * 0.42,
    height: width * 0.42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cardText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
