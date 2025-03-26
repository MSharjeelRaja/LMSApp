// import messaging from '@react-native-firebase/messaging';
// import { PermissionsAndroid } from 'react-native';

// const requestNotificationPermission = async () => {
//     try {
//         const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//         if (result === PermissionsAndroid.RESULTS.GRANTED) {
//             console.log("Notification permission granted");
//         } else {
//             console.log("Notification permission not granted");
//         }
//     } catch (error) {
//         console.error("Permission request failed", error);
//     }
// };

// export const getToken = async () => {
//     try {
//         const token = await messaging().getToken();
//         console.log("FCM TOKEN:", token);
//     } catch (error) {
//         console.error("Failed to get token:", error);
//     }
// };

// // Ensure Firebase is initialized before calling functions
// requestNotificationPermission();
// getToken();
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const fcm = () => {
  return (
    <View>
      <Text>fcm</Text>
    </View>
  )
}

export default fcm

const styles = StyleSheet.create({})