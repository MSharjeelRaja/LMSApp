import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, Easing } from 'react-native';
import { API_URL } from "../ControlsAPI/Comps";
import CircularLoader from '../ControlsAPI/loader'; // Import the CircularLoader component
import { useAlert } from '../ControlsAPI/alert';

const Loader = ({ navigation, route }) => {
  const loginData = route.params?.loginData;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const alertContext = useAlert();
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
    console.log("Received loginData:", loginData);
    
    const loginUser = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/Login?username=${encodeURIComponent(loginData.username)}&password=${encodeURIComponent(loginData.password)}`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        
        const data = await response.json();
        console.log("Login Response:", JSON.stringify(data));
        console.log("Login Response:", data);
        
        if (data.Type === "Student") {
          alert("u are Student");
          navigation.replace("BottomTabs", { userData: data });
        } else if (data.Type === "Teacher") {
         
          alertContext.showAlert('success', 'Teacher Login Successful');
          navigation.replace("TeacherTabs", { userData: data });
        } else if (data.Type === "JuniorLecturer") {
        
          navigation.replace("TeacherTabs", { userData: data });
        } else {
          alert("Access Denied! Only students can log in.");
          navigation.replace("Login");
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert(`Error: ${error.message || "Network issue"}`);
        navigation.replace("Login");
      }
    };
    
    loginUser();
  }, [loginData, navigation]);

  return (
    <View style={styles.container}>
      {/* Animated Image with smoother animation */}
      <Animated.View style={{ 
        transform: [{ scale: scaleAnim }],
        marginBottom: 30
      }}>
        <Image 
          style={{width: 150, height: 120}} 
          source={require("../images/as.png")} 
        />
      </Animated.View>
      
     
      <CircularLoader size={50} color="#007BFF" trackColor="#FFFFFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  }
});

export default Loader;