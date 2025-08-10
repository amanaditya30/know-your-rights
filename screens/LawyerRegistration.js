import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// --- Configuration ---
const API_URL = 'http://192.168.1.47:5001'; // Replace with your backend IP

// --- Placeholder for authenticated user/lawyer IDs ---
// In a real app, these would come from a login state
const CLIENT_USER_ID = 1;

// --- Main Lawyer Flow Component ---
const LawyerFlow = ({ navigation }) => {
    const [screen, setScreen] = useState('registration'); // 'registration', 'pending', 'approved', 'login', 'chat'
    const [loading, setLoading] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loggedInLawyer, setLoggedInLawyer] = useState(null);

    // State for registration form fields
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [barEnrollmentNumber, setBarEnrollmentNumber] = useState('');
    const [stateBarCouncil, setStateBarCouncil] = useState('');
    const [enrollmentYear, setEnrollmentYear] = useState('');
    const [cityOfPractice, setCityOfPractice] = useState('');
    const [stateOfPractice, setStateOfPractice] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [barIdCard, setBarIdCard] = useState(null);
    const [enrollmentCertificate, setEnrollmentCertificate] = useState(null);
    const [govtId, setGovtId] = useState(null);

    // --- Reusable Components (Defined here for clarity) ---

    const FormInput = ({ label, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default' }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
            />
        </View>
    );

    const DocumentUpload = ({ title, onUpload, file }) => (
        <View style={styles.uploadGroup}>
            <Text style={styles.uploadLabel}>{title}</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
                <Ionicons name="cloud-upload-outline" size={24} color="#0A2240" />
                <Text style={styles.uploadButtonText}>{file ? 'File Selected' : 'Choose File'}</Text>
            </TouchableOpacity>
            {file && <Text style={styles.fileName} numberOfLines={1}>{file.uri.split('/').pop()}</Text>}
        </View>
    );

    // --- Chat-related Components ---

    const ChatMessage = ({ message, senderType }) => (
        <View style={[styles.messageBubble, senderType === 'lawyer' ? styles.lawyerMessage : styles.clientMessage]}>
            {message.content && <Text style={[styles.messageText, senderType === 'lawyer' ? { color: '#0A2240' } : { color: '#FFFFFF' }]}>{message.content}</Text>}
            {message.file_path && (
                <TouchableOpacity onPress={() => Alert.alert('Document Link Clicked', 'This would open the document.')}>
                    <View style={styles.fileMessage}>
                        <Ionicons name="document-text" size={24} color="#0A2240" />
                        <Text style={styles.fileMessageText}>View Document</Text>
                    </View>
                </TouchableOpacity>
            )}
            <Text style={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString()}</Text>
        </View>
    );

    const ChatRoom = ({ chatRoomId, goBack, userType, companionName }) => {
        const [chatMessages, setChatMessages] = useState([]);
        const [messageInput, setMessageInput] = useState('');
        const [isSending, setIsSending] = useState(false);
    
        const fetchChatMessages = async () => {
            try {
                const response = await axios.get(`${API_URL}/chat/${chatRoomId}/messages`);
                if (response.data.success) {
                    setChatMessages(response.data.messages);
                }
            } catch (error) {
                console.error('Error fetching chat messages:', error);
                Alert.alert('Error', 'Could not fetch chat history.');
            }
        };
    
        const sendMessage = async () => {
            if (!messageInput.trim()) return;
    
            setIsSending(true);
            const formData = new FormData();
            formData.append('content', messageInput);
            formData.append('sender_id', userType === 'client' ? CLIENT_USER_ID : loggedInLawyer.id);
            formData.append('sender_type', userType);
    
            try {
                const response = await axios.post(`${API_URL}/chat/${chatRoomId}/messages`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response.data.success) {
                    setMessageInput('');
                    fetchChatMessages();
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to send message.');
                console.error(error);
            } finally {
                setIsSending(false);
            }
        };
    
        const sendDocument = async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
                    return;
                }
            }
    
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 0.7,
            });
    
            if (!result.canceled) {
                setIsSending(true);
                const formData = new FormData();
                const fileUri = result.assets[0].uri;
                const filename = fileUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;
    
                formData.append('document', { uri: fileUri, name: filename, type });
                formData.append('sender_id', userType === 'client' ? CLIENT_USER_ID : loggedInLawyer.id);
                formData.append('sender_type', userType);
    
                try {
                    const response = await axios.post(`${API_URL}/chat/${chatRoomId}/messages`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (response.data.success) {
                        fetchChatMessages();
                    }
                } catch (error) {
                    Alert.alert('Error', 'Failed to send document.');
                    console.error(error);
                } finally {
                    setIsSending(false);
                }
            }
        };
    
        useEffect(() => {
            fetchChatMessages();
        }, [chatRoomId]);
    
        return (
            <SafeAreaView style={styles.chatContainer}>
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={goBack}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.chatHeaderTitle}>{companionName}</Text>
                </View>
                <ScrollView style={styles.messageList} contentContainerStyle={styles.messageListContent}>
                    {chatMessages.map(msg => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            senderType={msg.sender_type}
                        />
                    ))}
                </ScrollView>
                <View style={styles.chatInputContainer}>
                    <TouchableOpacity onPress={sendDocument} style={styles.documentButton}>
                        <Ionicons name="attach" size={24} color="#0A2240" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message..."
                        value={messageInput}
                        onChangeText={setMessageInput}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={isSending}>
                        {isSending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={24} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    };

    const ChatInbox = ({ setScreen, userType }) => {
        const [chats, setChats] = useState([]);
        const [loading, setLoading] = useState(false);
        const [selectedChat, setSelectedChat] = useState(null);
    
        const fetchChats = async () => {
            setLoading(true);
            try {
                // This is a new route we need to add to the backend to get a lawyer's chats
                const response = await axios.get(`${API_URL}/lawyers/${loggedInLawyer.id}/chats`);
                if (response.data.success) {
                    setChats(response.data.chats);
                }
            } catch (error) {
                console.error('Error fetching chats:', error);
                Alert.alert('Error', 'Could not fetch chats.');
            } finally {
                setLoading(false);
            }
        };
    
        useEffect(() => {
            fetchChats();
        }, []);
    
        if (selectedChat) {
            return (
                <ChatRoom
                    chatRoomId={selectedChat.id}
                    goBack={() => setSelectedChat(null)}
                    userType={userType}
                    companionName={selectedChat.clientName}
                />
            );
        }
    
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chat Inbox</Text>
                    <Text style={styles.headerSubtitle}>Conversations with clients</Text>
                    <TouchableOpacity style={styles.modeButton} onPress={() => setScreen('login')}>
                        <Text style={styles.modeButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0A2240" />
                    ) : chats.length > 0 ? (
                        chats.map(chat => (
                            <TouchableOpacity key={chat.id} style={styles.lawyerCard} onPress={() => setSelectedChat(chat)}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.lawyerName}>{chat.clientName}</Text>
                                    <Text style={styles.lawyerDetail}>New chat request</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noChatsText}>No pending chat requests.</Text>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    };

    // --- API Calls ---
    
    const pickImage = async (setter) => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) {
            setter(result.assets[0]);
        }
    };

    const handleRegistration = async () => {
        if (!fullName || !email || !password || !barEnrollmentNumber || !profilePicture || !barIdCard) {
            Alert.alert('Missing Information', 'Please fill all required fields and upload necessary documents.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('contactNumber', contactNumber);
        formData.append('barEnrollmentNumber', barEnrollmentNumber);
        formData.append('stateBarCouncil', stateBarCouncil);
        formData.append('enrollmentYear', enrollmentYear);
        formData.append('cityOfPractice', cityOfPractice);
        formData.append('stateOfPractice', stateOfPractice);
        formData.append('bio', bio);

        const appendFile = (key, file) => {
            if (file) {
                let localUri = file.uri;
                let filename = localUri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image`;
                formData.append(key, { uri: localUri, name: filename, type });
            }
        };

        appendFile('profilePicture', profilePicture);
        appendFile('barIdCard', barIdCard);
        appendFile('enrollmentCertificate', enrollmentCertificate);
        appendFile('govtId', govtId);

        try {
            const response = await axios.post(`${API_URL}/lawyers/register`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.success) {
                setEmail(email); // Store email for status check
                setScreen('pending');
            } else {
                Alert.alert('Registration Failed', response.data.message || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('An Error Occurred', 'Could not connect to the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            Alert.alert('Missing Information', 'Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/lawyers/login`, {
                email: loginEmail,
                password: loginPassword,
            });
            if (response.data.success) {
                setLoggedInLawyer(response.data.lawyer);
                setScreen('chat');
            } else {
                Alert.alert('Login Failed', response.data.message || 'Invalid credentials or account not approved.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('An Error Occurred', 'Could not connect to the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const checkApprovalStatus = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/lawyers/status/${email}`);
            if (response.data.success) {
                if (response.data.status === 'approved') {
                    setScreen('approved');
                } else if (response.data.status === 'rejected') {
                    Alert.alert('Status Check', 'Your profile was rejected. Please re-register or contact support.');
                    setScreen('registration');
                } else {
                    Alert.alert('Status Check', 'Your profile is still under review.');
                }
            } else {
                Alert.alert('Error', response.data.message);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('An Error Occurred', 'Could not connect to the server to check status.');
        } finally {
            setLoading(false);
        }
    };

    // --- Screen Render Functions ---

    const renderRegistrationScreen = () => (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Lawyer Registration</Text>
                    <Text style={styles.headerSubtitle}>Create your professional profile to connect with clients.</Text>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <TouchableOpacity style={styles.profilePicContainer} onPress={() => pickImage(setProfilePicture)}>
                        {profilePicture ? (
                            <Image source={{ uri: profilePicture.uri }} style={styles.profilePic} />
                        ) : (
                            <View style={styles.profilePicPlaceholder}>
                                <Ionicons name="camera" size={40} color="#ccc" />
                                <Text style={styles.profilePicText}>Upload Profile Picture</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <FormInput label="Full Name*" value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
                    <FormInput label="Email Address*" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" />
                    <FormInput label="Password*" value={password} onChangeText={setPassword} placeholder="Create a secure password" secureTextEntry />
                    <FormInput label="Contact Number" value={contactNumber} onChangeText={setContactNumber} placeholder="Enter your phone number" keyboardType="phone-pad" />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Credentials</Text>
                    <FormInput label="Bar Council Enrollment Number*" value={barEnrollmentNumber} onChangeText={setBarEnrollmentNumber} placeholder="e.g., MAH/1234/2020" />
                    <FormInput label="State Bar Council*" value={stateBarCouncil} onChangeText={setStateBarCouncil} placeholder="e.g., Bar Council of Maharashtra & Goa" />
                    <FormInput label="Year of Enrollment*" value={enrollmentYear} onChangeText={setEnrollmentYear} placeholder="e.g., 2020" keyboardType="numeric" />
                    <FormInput label="State of Practice" value={stateOfPractice} onChangeText={setStateOfPractice} placeholder="e.g., Maharashtra" />
                    <FormInput label="City of Practice" value={cityOfPractice} onChangeText={setCityOfPractice} placeholder="e.g., Pune" />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Verification Documents</Text>
                    <DocumentUpload title="Bar Council ID Card*" onUpload={() => pickImage(setBarIdCard)} file={barIdCard} />
                    <DocumentUpload title="Enrollment Certificate (Sanad)" onUpload={() => pickImage(setEnrollmentCertificate)} file={enrollmentCertificate} />
                    <DocumentUpload title="Government Issued Photo ID" onUpload={() => pickImage(setGovtId)} file={govtId} />
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Practice Details</Text>
                    <Text style={styles.label}>Professional Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell clients about your experience, education, and approach..."
                        multiline
                        numberOfLines={4}
                    />
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={handleRegistration} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Register Profile</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => setScreen('login')}>
                    <Text style={styles.linkButtonText}>Already registered? Login here.</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );

    const renderLoginScreen = () => (
        <SafeAreaView style={styles.container}>
            <View style={styles.loginCard}>
                <Ionicons name="person-circle-outline" size={80} color="#0A2240" />
                <Text style={styles.loginTitle}>Lawyer Login</Text>
                <Text style={styles.loginSubtitle}>Use your registered email and password to log in.</Text>
                <FormInput
                    label="Email Address"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                />
                <FormInput
                    label="Password"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                />
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.loginButtonText}>Login</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={() => setScreen('registration')}>
                    <Text style={styles.linkButtonText}>Need to register? Click here.</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    const renderApprovedScreen = () => (
        <SafeAreaView style={styles.container}>
            <View style={styles.approvedCard}>
                <Ionicons name="checkmark-circle-outline" size={100} color="#28a745" />
                <Text style={styles.approvedTitle}>Congratulations!</Text>
                <Text style={styles.approvedMessage}>Your profile has been approved.</Text>
                <Text style={styles.approvedMessage}>You can now log in to access your chat inbox.</Text>
                <TouchableOpacity style={styles.approvedButton} onPress={() => setScreen('login')}>
                    <Text style={styles.approvedButtonText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    const renderPendingScreen = () => (
        <SafeAreaView style={styles.container}>
            <View style={styles.approvedCard}>
                <Ionicons name="time-outline" size={100} color="#ffc107" />
                <Text style={styles.approvedTitle}>Registration Submitted</Text>
                <Text style={styles.approvedMessage}>Your profile is under review.</Text>
                <Text style={styles.approvedMessage}>We'll notify you once it's approved.</Text>
                <TouchableOpacity
                    style={[styles.approvedButton, {backgroundColor: '#0A2240'}]}
                    onPress={checkApprovalStatus}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.approvedButtonText}>Check Approval Status</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    switch (screen) {
        case 'registration':
            return renderRegistrationScreen();
        case 'pending':
            return renderPendingScreen();
        case 'approved':
            return renderApprovedScreen();
        case 'login':
            return renderLoginScreen();
        case 'chat':
            return <ChatInbox setScreen={setScreen} userType="lawyer" />;
        default:
            return renderRegistrationScreen();
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FC', justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { padding: 20 },
    header: { marginBottom: 20, alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#0A2240' },
    headerSubtitle: { fontSize: 16, color: '#555', marginTop: 5, textAlign: 'center' },
    section: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 16, color: '#555', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#F4F7FC', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
    textArea: { height: 120, textAlignVertical: 'top' },
    profilePicContainer: { alignItems: 'center', marginBottom: 20 },
    profilePic: { width: 120, height: 120, borderRadius: 60 },
    profilePicPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
    profilePicText: { marginTop: 5, color: '#999' },
    uploadGroup: { marginBottom: 15 },
    uploadLabel: { fontSize: 16, color: '#555', marginBottom: 8, fontWeight: '500' },
    uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9F0FF', borderWidth: 1, borderColor: '#BCCDEB', borderRadius: 8, padding: 12, justifyContent: 'center' },
    uploadButtonText: { marginLeft: 10, fontSize: 16, color: '#0A2240', fontWeight: '600' },
    fileName: { marginTop: 8, fontSize: 12, color: '#555', fontStyle: 'italic' },
    submitButton: { backgroundColor: '#0A2240', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    loginCard: { width: '90%', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
    loginTitle: { fontSize: 24, fontWeight: 'bold', color: '#0A2240', marginTop: 10 },
    loginSubtitle: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center', marginBottom: 20 },
    loginButton: { backgroundColor: '#0A2240', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 20 },
    loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    approvedCard: { width: '90%', padding: 30, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
    approvedTitle: { fontSize: 24, fontWeight: 'bold', color: '#0A2240', marginTop: 20 },
    approvedMessage: { fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center' },
    approvedButton: { backgroundColor: '#0A2240', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%', marginTop: 20 },
    approvedButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    chatInboxContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatInboxTitle: { fontSize: 24, fontWeight: 'bold', color: '#0A2240' },
    chatInboxSubtitle: { fontSize: 16, color: '#666', marginTop: 10 },
    linkButton: { marginTop: 20 },
    linkButtonText: { color: '#0A2240', fontSize: 16, textDecorationLine: 'underline' }
});

export default LawyerFlow;
