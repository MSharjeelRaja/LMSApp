import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Animated, Easing, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { API_URL } from "../ControlsAPI/Comps";
import CircularLoader from '../ControlsAPI/loader';
import { useAlert } from '../ControlsAPI/alert';

const Loader = ({ navigation, route }) => {
  const loginData = route.params?.loginData;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const alertContext = useAlert();
  const [user, setUser] = useState('');
  const [otpShow, setOtpShow] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [data, setLoginData] = useState(null);
  const otpInputs = useRef([]);

  // Create smoother pulsing animation for the image
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.sine,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.sine,
          useNativeDriver: true
        })
      ])
    ).start();
    
    return () => scaleAnim.resetAnimation();
  }, []);

  // Handle login logic
  useEffect(() => {
    if (!loginData?.username || !loginData?.password) {
      alert("Invalid login data!");
      navigation.replace('Login');
      return;
    }

    const loginUser = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 21000); 
    
      try {
        const response = await fetch(
          `${API_URL}/api/Login?username=${encodeURIComponent(loginData.username)}&password=${encodeURIComponent(loginData.password)}`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
            signal: controller.signal
          }
        );
    console.log('reppp ='+response);
        clearTimeout(timeout);
    
        const data = await response.json();
        console.log(data);
    
        if (data.Type === "Student") {
          setUser('Student');
          setLoginData(data.StudentInfo);
        } else if (data.Type === "Teacher") {
          setUser('Teacher');
          setLoginData(data.TeacherInfo);
        } else if (data.Type === "JuniorLecturer") {
          setUser('Jlec');
          setLoginData(data.TeacherInfo);
        } else {
          alertContext.showAlert('warning', "Access Denied! Invalid credentials");
          navigation.replace("Login");
        }
    
        setOtpShow(true);
    
      } catch (error) {
        clearTimeout(timeout);
        const isTimeout = error.name === 'AbortError';
        alertContext.showAlert('error', isTimeout ? "Login request timed out" : error.message || "Network issue");
        navigation.replace("Login");
      }
    };
    
    
    loginUser();
  }, [loginData, navigation]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus to next input
    if (value && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
   
  
    // Developer bypass - grant access if OTP is 111111
    if (otpString === '111111') {
      alertContext.showAlert('success', 'Access Granted');
      if (user === "Student") {
        navigation.replace("BottomTabs", { userData: data });
      } else if (user === "Teacher" ) {
        navigation.replace("TeacherTabs", { userData: data });
      }
      else if (  user === "Jlec" ) {
        navigation.replace("JTabs", { userData: data });
      }
    
      return;
    }
    if (otpString.length !== 6) {
      alertContext.showAlert('error', 'Please enter a 6-digit OTP');
      return;
    }
  
    console.log(otpString + ' ' + data.user_id);
    try {
      const response = await fetch(`${API_URL}/api/verify/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: data.user_id,
          otp: otpString,
        }),
      });
  
      const result = await response.json();
      console.log(result);
      
      // Check if the response itself is successful (HTTP 200-299)
      if (response.ok) {
        // Check the actual success condition from your API
        if (result.success || result.status === "success") {
          alertContext.showAlert('success', result.message || 'OTP verification successful');
          console.log('data is' +data)
          if (user === "Student") {
            navigation.replace("BottomTabs", { userData: data });
          } else if (user === "Teacher" ) {
            navigation.replace("TeacherTabs", { userData: data });
          }
        } else {
          alertContext.showAlert('error', result.message || 'OTP verification failed');
        }
      } else {
        // Handle HTTP errors
        alertContext.showAlert('error', result.message || 'OTP verification failed');
      }
    } catch (error) {
     
      alertContext.showAlert('error', 'An error occurred during OTP verification');
    }
  };
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {!otpShow ? (
        <View style={styles.loaderContainer}>
          <Animated.View style={{ 
            transform: [{ scale: scaleAnim }],
            marginBottom: 30
          }}>
            <Image 
              style={styles.logo} 
              source={require("../images/as.png")} 
            />
          </Animated.View>
          <CircularLoader size={50} color="#007BFF" trackColor="#FFFFFF" />
          <Text style={styles.loadingText}>Verifying your credentials...</Text>
        </View>
      ) : (
        <View style={styles.otpContainer}>
          <Image 
            style={styles.otpLogo} 
            source={require("../images/as.png")} 
          />
          <Text style={styles.otpTitle}>Enter OTP</Text>
          <Text style={styles.otpSubtitle}>We've sent a 6-digit code to your registered email</Text>
          
          <View style={styles.otpInputContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpInputs.current[index] = ref)}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleOtpKeyPress(e, index)}
                selectTextOnFocus
              />
            ))}
          </View>
          
          <TouchableOpacity style={styles.verifyButton} onPress={verifyOtp}>
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resendLink}>
            <Text  style={styles.resendText}>Didn't receive code? <Text style={styles.resendLinkText}>Resend</Text></Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  logo: {
    width: 150,
    height: 120
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555'
  },
  otpContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  otpLogo: {
    width: 100,
    height: 80,
    marginBottom: 30
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10
  },
  otpInputContainer: {
    flexDirection: 'row',
   
    marginBottom: 30,
    width: '84%'
  },
  otpInput: {
    width: 45,
    height: 50,margin:2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f9f9f9'
  },
  verifyButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  resendText: {
    color: '#777',
    fontSize: 14
  },
  resendLinkText: {
    color: '#007BFF',
    fontWeight: 'bold'
  }
});

export default Loader;