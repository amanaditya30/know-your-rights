import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = 'http://192.168.1.47:5001';

const timeAgo = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

// --- MODIFIED: PostCard now accepts navigation and handles navigating to comments ---
const PostCard = ({ post, onVote, onDelete, currentUserId, navigation }) => {
    const [voteStatus, setVoteStatus] = useState(0);

    const confirmDelete = () => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to permanently delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => onDelete(post.id), style: "destructive" },
            ]
        );
    };

    // --- NEW: Function to navigate to the comment screen ---
    const navigateToComments = () => {
        navigation.navigate('CommentScreen', { post });
    };

    return (
        // --- MODIFIED: The entire content area is now pressable to navigate ---
        <View style={styles.card}>
            <View style={styles.voteContainer}>
                <TouchableOpacity onPress={() => onVote(post.id, 'up')}>
                    <Ionicons name="arrow-up-circle" size={30} color={voteStatus === 1 ? '#2ecc71' : '#ccc'} />
                </TouchableOpacity>
                <Text style={styles.score}>{String(post.score || 0)}</Text>
                <TouchableOpacity onPress={() => onVote(post.id, 'down')}>
                    <Ionicons name="arrow-down-circle" size={30} color={voteStatus === -1 ? '#e74c3c' : '#ccc'} />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.postContentContainer} onPress={navigateToComments}>
                <View style={styles.cardHeader}>
                    <Text style={styles.authorName} numberOfLines={1}>
                        Posted by {String(post.author || 'Unknown')}
                    </Text>
                    <View style={styles.headerRight}>
                        <Text style={styles.timestamp}>{String(timeAgo(post.timestamp))}</Text>
                        {currentUserId === post.user_id && (
                            <TouchableOpacity onPress={confirmDelete} style={{ marginLeft: 10 }}>
                                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <Text style={styles.cardContent}>{String(post.content || '')}</Text>
                <View style={styles.cardFooter}>
                    {/* --- NEW: Comment button and count --- */}
                    <View style={styles.footerButton}>
                        <Ionicons name="chatbubble-outline" size={16} color="#888" />
                        <Text style={styles.footerButtonText}>{String(post.comment_count || 0)} Comments</Text>
                    </View>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#888" />
                        <Text style={styles.locationText}>{String(post.location || 'Unknown')}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const ForumScreen = ({ navigation, route }) => {
    const currentUserId = route.params?.userId;
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('Hot');

    useFocusEffect(
        React.useCallback(() => {
            fetchPosts();
        }, [sortBy])
    );

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/posts`);
            // --- MODIFIED: Ensure comment_count is handled ---
            const postsWithDetails = response.data.posts.map(p => ({ 
                ...p, 
                score: p.score || 0,
                comment_count: p.comment_count || 0 // Make sure comment_count exists
            }));
            setPosts(postsWithDetails);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            Alert.alert("Error", "Could not fetch forum posts.");
        } finally {
            setLoading(false);
        }
    };

    const handleVote = (postId, voteType) => {
        // This is UI only for now
    };

    const handleDelete = async (postId) => {
        try {
            const response = await axios.delete(`${API_URL}/posts/${postId}`);
            if (response.data.success) {
                setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
                Alert.alert("Success", "Post deleted.");
            } else {
                Alert.alert("Error", response.data.message);
            }
        } catch (error) {
            Alert.alert("Error", "Could not delete post.");
        }
    };

    const renderSortButton = (title) => (
        <TouchableOpacity
            style={[styles.sortButton, sortBy === title && styles.sortButtonActive]}
            onPress={() => setSortBy(title)}
        >
            <Text style={[styles.sortButtonText, sortBy === title && styles.sortButtonTextActive]}>
                {String(title)}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0EAD6" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Community Forum</Text>
            </View>
            <View style={styles.sortContainer}>
                {renderSortButton('Hot')}
                {renderSortButton('New')}
                {renderSortButton('Top')}
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#0A2240" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={posts}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            onVote={handleVote}
                            onDelete={handleDelete}
                            currentUserId={currentUserId}
                            navigation={navigation} // --- MODIFIED: Pass navigation prop
                        />
                    )}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    onRefresh={fetchPosts}
                    refreshing={loading}
                />
            )}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost', { userId: currentUserId })}>
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0EAD6',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0D8C7',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0A2240',
        textAlign: 'center',
    },
    sortContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
    },
    sortButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    sortButtonActive: {
        backgroundColor: '#0A2240',
    },
    sortButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0A2240',
    },
    sortButtonTextActive: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 10,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
    },
    voteContainer: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0A2240',
        marginVertical: 5,
    },
    postContentContainer: {
        flex: 1,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        flexShrink: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        color: '#888',
    },
    cardContent: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between', // --- MODIFIED
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 10,
        marginTop: 10,
    },
    // --- NEW: Styles for the comment button ---
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
        marginLeft: 4,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#0A2240',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default ForumScreen;
 