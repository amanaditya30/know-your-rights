import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TextInput, 
    TouchableOpacity, 
    SafeAreaView, 
    KeyboardAvoidingView, 
    Platform, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://192.168.1.47:5001'; // Replace with your backend IP

// --- RECURSIVE COMMENT CARD COMPONENT ---
const CommentCard = ({ comment, onLike, onReply, onDelete, currentUser, postAuthorId, level = 0 }) => {
    // Check if the current user can delete this comment
    const canDelete = currentUser?.id === comment.user_id || currentUser?.id === postAuthorId;

    return (
        <View>
            <View style={[styles.commentContainer, { marginLeft: level * 20 }]}>
                <View style={styles.avatar}>
                    <Ionicons name="person-circle" size={40} color="#555" />
                </View>
                <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        {/* Show delete button only if authorized */}
                        {canDelete && (
                             <TouchableOpacity onPress={() => onDelete(comment.id)}>
                                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(comment.id)}>
                            {/* The 'user_has_liked' prop now comes directly from the API */}
                            <Ionicons name={comment.user_has_liked ? "heart" : "heart-outline"} size={20} color={comment.user_has_liked ? '#e74c3c' : '#555'} />
                            <Text style={styles.actionText}>{comment.like_count} Likes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => onReply(comment)}>
                            <Ionicons name="arrow-undo-outline" size={20} color="#555" />
                            <Text style={styles.actionText}>Reply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {/* Render replies recursively */}
            {comment.replies && comment.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {comment.replies.map(reply => (
                        <CommentCard 
                            key={reply.id}
                            comment={reply}
                            onLike={onLike}
                            onReply={onReply}
                            onDelete={onDelete}
                            currentUser={currentUser}
                            postAuthorId={postAuthorId}
                            level={level + 1} 
                        />
                    ))}
                </View>
            )}
        </View>
    );
};


const CommentScreen = ({ navigation, route }) => {
    const { post } = route.params; 
    const { user } = useAuth();

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Fetch comments when the component mounts or when the user changes
        if (user) {
            fetchComments();
        }
    }, [user]);

    // --- MODIFIED: fetchComments now sends the user ID ---
    const fetchComments = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Pass the logged-in user's ID as a query parameter
            const response = await axios.get(`${API_URL}/posts/${post.id}/comments`, {
                params: { user_id: user.id }
            });

            if (response.data.success) {
                // The backend now returns 'user_has_liked', so no extra processing is needed
                setComments(response.data.comments);
            } else {
                Alert.alert("Error", "Could not load comments.");
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            Alert.alert("Error", "An error occurred while loading comments.");
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (commentId) => {
        if (!user) return;
        
        // Optimistic update
        const updateLikes = (list) => {
             return list.map(c => {
                if (c.id === commentId) {
                    const user_has_liked = !c.user_has_liked;
                    const like_count = user_has_liked ? c.like_count + 1 : c.like_count - 1;
                    return { ...c, user_has_liked, like_count };
                }
                if (c.replies) {
                    return { ...c, replies: updateLikes(c.replies) };
                }
                return c;
            });
        };
        setComments(updateLikes(comments));

        // API call
        try {
            await axios.post(`${API_URL}/comments/${commentId}/like`, { user_id: user.id });
        } catch (error) {
            console.error("Failed to like comment:", error);
            // Revert on failure
            fetchComments(); 
            Alert.alert("Error", "Could not update like status.");
        }
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setNewComment(`@${comment.author} `);
        inputRef.current?.focus();
    };
    
    const handleDelete = (commentId) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const response = await axios.delete(`${API_URL}/comments/${commentId}`, {
                                data: { user_id: user.id }
                            });

                            if (response.data.success) {
                                const removeComment = (list) => {
                                    return list.filter(c => c.id !== commentId).map(c => {
                                        if (c.replies) {
                                            return { ...c, replies: removeComment(c.replies) };
                                        }
                                        return c;
                                    });
                                };
                                setComments(removeComment(comments));
                            } else {
                                Alert.alert("Error", response.data.message || "Could not delete comment.");
                            }
                        } catch (error) {
                             console.error("Failed to delete comment:", error);
                             Alert.alert("Error", "An error occurred while deleting the comment.");
                        }
                    } 
                }
            ]
        );
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !user) return;
        
        const payload = {
            content: newComment,
            user_id: user.id,
            parent_id: replyingTo ? replyingTo.id : null
        };

        try {
            const response = await axios.post(`${API_URL}/posts/${post.id}/comments`, payload);

            if (response.data.success) {
                const addedComment = response.data.comment;
                
                // We need to add the 'user_has_liked' field to the new comment client-side
                addedComment.user_has_liked = false; 
                
                if (replyingTo) {
                    const addReply = (list) => {
                        return list.map(c => {
                            if (c.id === replyingTo.id) {
                                return { ...c, replies: [...(c.replies || []), addedComment] };
                            }
                            if (c.replies) {
                                return { ...c, replies: addReply(c.replies) };
                            }
                            return c;
                        });
                    };
                    setComments(addReply(comments));
                } else {
                    setComments([addedComment, ...comments]);
                }

                setNewComment('');
                setReplyingTo(null);
            } else {
                Alert.alert("Error", response.data.message || "Failed to post comment.");
            }
        } catch (error) {
            console.error("Failed to add comment:", error);
            Alert.alert("Error", "An error occurred while posting your comment.");
        }
    };

    const renderComment = ({ item }) => (
        <CommentCard 
            comment={item} 
            onLike={handleLike} 
            onReply={handleReply}
            onDelete={handleDelete}
            currentUser={user}
            postAuthorId={post.user_id}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#0A2240" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comments</Text>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={60}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#0A2240" style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        ListHeaderComponent={
                            <View style={styles.postContainer}>
                                <Text style={styles.postAuthor}>Posted by {post.author}</Text>
                                <Text style={styles.postContent}>{post.content}</Text>
                            </View>
                        }
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={item => item.id.toString()}
                        style={styles.commentList}
                        ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first!</Text>}
                    />
                )}

                <View style={styles.inputContainer}>
                    {replyingTo && (
                        <View style={styles.replyingToContainer}>
                            <Text style={styles.replyingToText}>Replying to @{replyingTo.author}</Text>
                            <TouchableOpacity onPress={() => { setReplyingTo(null); setNewComment(''); }}>
                                <Ionicons name="close-circle" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Add a comment..."
                            placeholderTextColor="#888"
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
                            <Ionicons name="send" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0EAD6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0D8C7',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0A2240',
    },
    postContainer: {
        backgroundColor: '#FFF',
        padding: 15,
        margin: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0D8C7'
    },
    postAuthor: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 10,
    },
    postContent: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333'
    },
    commentList: {
        paddingHorizontal: 10,
    },
    commentContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    repliesContainer: {
        // Styles for the container of replies if needed
    },
    avatar: {
        marginRight: 10,
    },
    commentBody: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentAuthor: {
        fontWeight: 'bold',
        color: '#0A2240',
    },
    commentContent: {
        color: '#333',
        lineHeight: 20,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 10,
        paddingTop: 5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionText: {
        marginLeft: 5,
        color: '#555',
        fontWeight: '600',
    },
    inputContainer: {
        paddingBottom: 10,
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0D8C7',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#0A2240',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyingToContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#EFEFEF',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    replyingToText: {
        color: '#555',
        fontStyle: 'italic',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    },
});

export default CommentScreen;