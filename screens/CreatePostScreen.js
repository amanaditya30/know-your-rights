import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, 
    SafeAreaView, Alert, Switch, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// --- IMPORTANT ---
// Replace this with your actual backend IP address.
const API_URL = 'http://192.168.1.47:5001'; // Example: 'http://192.168.1.5:5001'

const CreatePostScreen = ({ navigation, route }) => {
    const [content, setContent] = useState('');
    const [location, setLocation] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    // Get the logged-in user's ID passed from navigation
    // In a real app, this would come from a global state (like Context or Redux)
    const userId = route.params?.userId || 1; // Fallback to 1 for now

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert("Error", "Post content cannot be empty.");
            return;
        }

        setLoading(true);
        try {
            const postData = {
                user_id: userId, 
                content,
                location,
                is_anonymous: isAnonymous,
            };

            const response = await axios.post(`${API_URL}/posts`, postData);

            if (response.data.success) {
                Alert.alert("Success", "Your post has been submitted.");
                navigation.goBack(); // Go back to the forum screen
            } else {
                Alert.alert("Error", response.data.message || "Failed to create post.");
            }
        } catch (error) {
            console.error("Failed to create post:", error);
            Alert.alert("Error", "An error occurred while submitting your post.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color="#0A2240" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create a New Post</Text>
                    <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.postButtonText}>Post</Text>}
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollView}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="What's on your mind?"
                        placeholderTextColor="#888"
                        multiline
                        value={content}
                        onChangeText={setContent}
                    />
                    <View style={styles.optionsContainer}>
                        <View style={styles.optionRow}>
                            <Ionicons name="location-outline" size={24} color="#555" />
                            <TextInput
                                style={styles.locationInput}
                                placeholder="Add location (e.g., Pune)"
                                placeholderTextColor="#888"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                        <View style={styles.optionRow}>
                            <Ionicons name="eye-off-outline" size={24} color="#555" />
                            <Text style={styles.anonymousText}>Post Anonymously</Text>
                            <Switch
                                trackColor={{ false: "#767577", true: "#81b0ff" }}
                                thumbColor={isAnonymous ? "#0A2240" : "#f4f3f4"}
                                onValueChange={() => setIsAnonymous(previousState => !previousState)}
                                value={isAnonymous}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0D8C7',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0A2240',
    },
    postButton: {
        backgroundColor: '#0A2240',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollView: {
        padding: 15,
    },
    textInput: {
        fontSize: 18,
        minHeight: 150,
        textAlignVertical: 'top', // For Android
        color: '#333',
    },
    optionsContainer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    locationInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
    anonymousText: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
});

export default CreatePostScreen;