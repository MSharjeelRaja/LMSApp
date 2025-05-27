import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Easing
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../ControlsAPI/Comps';
import { Image } from 'react-native';
import { getApiUrl } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
const LMS = ({ navigation, route }) => {
  const [u, setU] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_URL);
  
  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const apiTextOpacity = useRef(new Animated.Value(0)).current;
  
  // Load saved credentials and update API_URL on mount
  useEffect(() => {
    const loadApiUrl = async () => {
 await AsyncStorage.getItem('api_url');
    };
    loadApiUrl();
    getApiUrl();
  
    const loadCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        const savedPassword = await AsyncStorage.getItem('password');
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');

        if (savedRememberMe === 'true' && savedUsername && savedPassword) {
          setU(savedUsername);
          setPassword(savedPassword);
          setRememberMe(true);
        }

        // Update API_URL dynamically
        setApiUrl(API_URL);
      } catch (error) {
        console.error('Error loading credentials:', error);
      }
    };
    loadCredentials();
    
    // Staggered entrance animations
    Animated.sequence([
      // First fade in container
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      
      // Then animate logo and header simultaneously
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]),
      
      // Then animate form fields
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      
      // Finally fade in button and API text
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(apiTextOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

 
  const handleLogin = async () => {
    
    Animated.sequence([
      Animated.timing(buttonOpacity, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (rememberMe) {
      await AsyncStorage.setItem('username', u);
      await AsyncStorage.setItem('password', password);
      await AsyncStorage.setItem('rememberMe', 'true');
    } else {
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('password');
      await AsyncStorage.setItem('rememberMe', 'false');
    }

    // Fade out before navigation
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('loginLoader', { loginData: { username: u, password } });
    });
  };

  // Navigate to IP Change Screen
  const handleLongPressWelcomeText = () => {
    navigation.navigate('ipChange');
  };

  return (
    <Animated.View style={[
      styles.container,
      { opacity: containerOpacity }
    ]}>
      
      {/* Logo and Welcome Text */}
      <TouchableOpacity 
        onLongPress={handleLongPressWelcomeText} 
        delayLongPress={1000}
        activeOpacity={0.9}
      >
        <Animated.View style={{
          transform: [{ scale: logoScale }],
          alignItems: 'center'
        }}>
          <Image 
            style={styles.logo}
            source={require("../images/as.png")} 
          />
        </Animated.View>
      </TouchableOpacity>
      
      {/* Header Section */}
      <Animated.View style={{
        transform: [{ translateY: headerSlide }],
        opacity: Animated.add(headerSlide, 20).interpolate({
          inputRange: [0, 20],
          outputRange: [0, 1]
        })
      }}>
        <Text style={styles.welcomeText}>
          WELCOME TO <Text style={styles.lmsText}>LMS</Text>
        </Text>
        
        <Text style={styles.subtitle}>
          Please enter your details.
        </Text>
        
        <Text style={styles.loginText}>
          Login
        </Text>
      </Animated.View>

      {/* Form Section */}
      <Animated.View style={{
        width: '100%',
        transform: [{ translateY: formSlide }],
        opacity: Animated.subtract(30, formSlide).interpolate({
          inputRange: [0, 30],
          outputRange: [0, 1]
        })
      }}>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#6c757d"
          value={u}
          onChangeText={setU}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6c757d"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.rememberMeContainer}>
          <CheckBox
            value={rememberMe}
            onValueChange={setRememberMe}
            tintColors={{ true: '#0047AB', false: '#6c757d' }}
          />
          <Text style={styles.rememberMeText}>Remember me</Text>
        </View>
      </Animated.View>
      
      {/* Button Section */}
      <Animated.View style={{
        alignItems: 'center',
        opacity: buttonOpacity
      }}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* API URL Display */}
      <Animated.Text style={[
        styles.apiText,
        { opacity: apiTextOpacity }
      ]}>
        Your IP is: {apiUrl}
      </Animated.Text>
    </Animated.View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.white, 
    paddingHorizontal: 20, 
    justifyContent: 'center'
  },
  logo: {
    width: 80,
    height: 70,
    alignSelf: 'center',
    marginBottom: 10,
  },
  welcomeText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: 'black',
    marginTop: 5
  },
  lmsText: { 
    color: '#0047AB' 
  },
  subtitle: { 
    fontSize: 14, 
    textAlign: 'center', 
    color: '#6c757d', 
    marginBottom: 10 
  },
  loginText: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: '#0047AB', 
    marginBottom: 20 
  },
  apiText: { 
    fontSize: 14, 
    color: '#555', 
    textAlign: 'center', 
    marginTop: 30 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    color: 'black',
  },
  rememberMeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  rememberMeText: { 
    fontSize: 14, 
    color: '#6c757d',
    marginLeft: 5
  },
  button: { 
    backgroundColor: '#0047AB', 
    paddingVertical: 10, 
    borderRadius: 15, 
    alignItems: 'center', 
    width: 260,
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    marginTop: 10
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '600' 
  },
});

export default LMS;