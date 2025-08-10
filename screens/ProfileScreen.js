import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Make sure this path is correct

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    onPress: () => {
                        logout();
                        // After logout, the user will be automatically navigated to the Auth screen
                        // by the logic in App.js
                    },
                    style: "destructive"
                }
            ]
        );
    };

    // A reusable component for each option in the list
    const ProfileOption = ({ icon, text, onPress, color = '#333' }) => (
        <TouchableOpacity style={styles.optionButton} onPress={onPress}>
            <Ionicons name={icon} size={24} color={color} style={styles.optionIcon} />
            <Text style={[styles.optionText, { color: color }]}>{text}</Text>
            <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.profileHeader}>
                    <Image
                        source={{ uri: user?.profilePicture || 'https://placehold.co/100x100/EFEFEF/AAAAAA&text=P' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'guest@example.com'}</Text>
                </View>

                {/* --- NEW: Section for Lawyer Registration --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Become an Expert</Text>
                    <TouchableOpacity 
                        style={styles.expertButton} 
                        onPress={() => navigation.navigate('LawyerRegistration')}
                    >
                        <Ionicons name="briefcase-sharp" size={24} color="#FFFFFF" />
                        <Text style={styles.expertButtonText}>Register as a Legal Expert</Text>
                    </TouchableOpacity>
                    <Text style={styles.expertDescription}>
                        Join our panel of verified legal professionals to offer your expertise and connect with clients.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <ProfileOption icon="person-circle-outline" text="Edit Profile" onPress={() => { /* Navigate to Edit Profile screen */ }} />
                    <ProfileOption icon="shield-checkmark-outline" text="Rights & Policies" onPress={() => navigation.navigate('RightsPolicies')} />
                    <ProfileOption icon="notifications-outline" text="Notifications" onPress={() => { /* Navigate to Notifications screen */ }} />
                    <ProfileOption icon="help-circle-outline" text="Help & Support" onPress={() => { /* Navigate to Help screen */ }} />
                </View>

                <View style={styles.section}>
                    <ProfileOption icon="log-out-outline" text="Logout" onPress={handleLogout} color="#e74c3c" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FC',
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFFFFF',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#0A2240',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
    },
    userEmail: {
        fontSize: 16,
        color: '#777',
        marginTop: 5,
    },
    section: {
        marginTop: 20,
        marginHorizontal: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    optionIcon: {
        width: 40,
    },
    optionText: {
        flex: 1,
        fontSize: 18,
        fontWeight: '500',
    },
    expertButton: {
        flexDirection: 'row',
        backgroundColor: '#27ae60',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expertButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    expertDescription: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    }
});

export default ProfileScreen;
