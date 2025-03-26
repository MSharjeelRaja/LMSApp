import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

export default function LoadingScreen({navigation}) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start animations
    Animated.sequence([
      // First fade in and scale up the logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Then fade in the text
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();

    // Set navigation timeout
    const timer = setTimeout(() => {
      // Fade out everything before navigating
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.replace('Login');
      });
    }, 2000); // 2 seconds total, with fade out at the end
    
    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, textFadeAnim]);
  
  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.logoContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        <Image 
          source={require("../images/as.png")} 
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.Text style={[
        styles.title,
        { opacity: textFadeAnim }
      ]}>
        LMS
      </Animated.Text>
      
      <Animated.Text style={[
        styles.subtitle,
        { opacity: textFadeAnim }
      ]}>
        Empowering Minds | Igniting Futures.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 170,
    height: 170,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0047AB',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#094cf5',
    marginTop: 8,
    textAlign: 'center',
  },
});