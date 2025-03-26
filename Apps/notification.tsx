// import { Alert, StyleSheet, Text, View } from 'react-native'
// import React, { useEffect } from 'react'
// import {PermissionsAndroid} from 'react-native';
// import messaging from '@react-native-firebase/messaging';
// const App = () => {
//   useEffect(()=>{
//   requestpermission();
//   })
//   const requestpermission=async()=>{
//     const granted =await  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//   if(granted===PermissionsAndroid.RESULTS.GRANTED){
//     Alert.alert('granted');
// gettoken();
//   }
//   else{
//     Alert.alert('no');
//   }
//   };
//   useEffect(() => {
//     const unsubscribe = messaging().onMessage(async remoteMessage => {
//       Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
//     });

//     return unsubscribe;
//   }, []);
//   const gettoken=async ()=>{
   
//     const token = await messaging().getToken();
//     console.log(token)
//   }
//   return (
//     <View>
//       <Text>App</Text>
//     </View>
//   )
// }

// export default App

// const styles = StyleSheet.create({})
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const notification = () => {
  return (
    <View>
      <Text>notification</Text>
    </View>
  )
}

export default notification

const styles = StyleSheet.create({})