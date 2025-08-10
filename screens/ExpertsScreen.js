import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ExpertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Know Your Rights</Text>
      <Text style={styles.sub}>Your Legal Assistant & Support Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  sub: { fontSize: 16, color: '#777' },
});
