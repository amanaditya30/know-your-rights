import React, { useState } from 'react';
import { 
    View, Text, TextInput, StyleSheet, TouchableOpacity, 
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, 
    Image, ScrollView, SafeAreaView, StatusBar 
} from 'react-native';

// --- DEPENDENCIES (NEEDS INSTALLATION) ---
// For the icons to work, you must install this package by running
// the following command in your project's terminal:
// npx expo install @expo/vector-icons axios
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';


// --- IMPORTANT ---
// Replace this with your actual backend IP address.
const API_URL = 'http://192.168.1.47:5001'; // Example: 'http://192.168.1.5:5001'

// --- LOGO ---
// To use your local logo, place 'logo.jpg' in an 'assets' folder
// in your project's root directory, then change the line below to:
const logo = require('../assets/logo.png');
//const logo = { uri: 'http://googleusercontent.com/file_content/2' };

const AuthScreen = ({ navigation }) => {
    // State to switch between 'Login', 'Signup', and 'ForgotPassword' forms
    const [authMode, setAuthMode] = useState('Login'); 
    
    // Common state for inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Signup specific state
    const [name, setName] = useState('');

    // OTP and new password state for verification/reset
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Loading and error state
    const [loading, setLoading] = useState(false);

    // --- Form Components ---

    const renderLoginForm = () => (
        <>
            <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your account</Text>
            
            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#8A795D"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8A795D"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAuthMode('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
        </>
    );

    const renderSignupForm = () => (
        <>
            <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Get started by filling out the form below</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#8A795D"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#8A795D"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8A795D"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create Account</Text>}
            </TouchableOpacity>
        </>
    );
    
    const renderForgotPasswordForm = () => (
         <>
            <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#8A795D"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
                 {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
        </>
    );

    const renderVerifyOTPForm = () => (
        <>
            <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} />
            </View>
            <Text style={styles.title}>Enter Code</Text>
            <Text style={styles.subtitle}>A 6-digit code was sent to your email</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="OTP Code"
                    placeholderTextColor="#8A795D"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                />
            </View>
            
            {authMode === 'VerifyResetOTP' && (
                 <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={22} color="#8A795D" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="New Password"
                        placeholderTextColor="#8A795D"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />
                </View>
            )}
            
            <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={loading}>
                 {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Verify & Proceed</Text>}
            </TouchableOpacity>
        </>
    );


    // --- API Handlers ---

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            Alert.alert('Success', response.data.message);
            // On successful login, navigate to the main part of the app
            navigation.replace('MainApp', { user: response.data.user });
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            Alert.alert('Login Failed', message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/register`, { name, email, password });
            Alert.alert('Success', response.data.message);
            // Move to OTP verification screen after successful registration request
            setAuthMode('VerifySignupOTP');
        } catch (error) {
            const message = error.response?.data?.message || 'Signup failed. Please try again.';
            Alert.alert('Signup Failed', message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/forgot-password`, { email });
            Alert.alert('Success', response.data.message);
            // Move to OTP verification screen for password reset
            setAuthMode('VerifyResetOTP');
        } catch (error) {
             const message = error.response?.data?.message || 'Could not send OTP. Please try again.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP.');
            return;
        }

        let url = '';
        let payload = {};

        if (authMode === 'VerifySignupOTP') {
            url = `${API_URL}/verify-email`;
            payload = { email, otp };
        } else if (authMode === 'VerifyResetOTP') {
             if (!newPassword) {
                Alert.alert('Error', 'Please enter a new password.');
                return;
            }
            url = `${API_URL}/reset-password`;
            payload = { email, otp, new_password: newPassword };
        } else {
            return; // Should not happen
        }

        setLoading(true);
        try {
            const response = await axios.post(url, payload);
            Alert.alert('Success', response.data.message);
            // After verification/reset, send user to the login screen
            setAuthMode('Login');
            // Clear sensitive fields
            setOtp('');
            setPassword('');
            setNewPassword('');
        } catch (error) {
            const message = error.response?.data?.message || 'Verification failed. Please try again.';
            Alert.alert('Verification Failed', message);
        } finally {
            setLoading(false);
        }
    };


    // --- Main Render ---

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0EAD6" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollView}>
                    <View style={styles.formContainer}>
                        {authMode === 'Login' && renderLoginForm()}
                        {authMode === 'Signup' && renderSignupForm()}
                        {authMode === 'ForgotPassword' && renderForgotPasswordForm()}
                        {(authMode === 'VerifySignupOTP' || authMode === 'VerifyResetOTP') && renderVerifyOTPForm()}
                    </View>

                    <View style={styles.bottomContainer}>
                        {authMode === 'Login' && (
                            <TouchableOpacity onPress={() => setAuthMode('Signup')}>
                                <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text></Text>
                            </TouchableOpacity>
                        )}
                        {(authMode === 'Signup' || authMode === 'ForgotPassword' || authMode.startsWith('Verify')) && (
                            <TouchableOpacity onPress={() => setAuthMode('Login')}>
                                <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Login</Text></Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0EAD6', // Cream background from Home Screen
    },
    scrollView: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    formContainer: {
        marginHorizontal: 30,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0A2240', // Dark Blue from Home Screen
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0D8C7'
    },
    inputIcon: {
        padding: 12,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 10,
        color: '#0A2240',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#0A2240', // Dark Blue
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotPasswordText: {
        color: '#0A2240',
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '600'
    },
    bottomContainer: {
        marginTop: 30,
        alignItems: 'center',
        paddingBottom: 20,
    },
    switchText: {
        color: '#0A2240',
        fontSize: 16,
    },
    switchTextBold: {
        fontWeight: 'bold',
    },
});

export default AuthScreen;
