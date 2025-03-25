import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoaderScreen from './login/Loader';
import LoginScreen from './login/login';
import grader from './Grader/grader';
import loginLoader from './login/loginLoader';
import BottomTabs from './StudentScreens/S_Home';
import ipChange from './ControlsAPI/ipChange';
import otpscreen from './login/otpscreen';
import TeacherTabs from './TeacherScreens/THome';
import SubjectAttendence from './StudentScreens/SubjectAttendence';
import AttendeceAll from './StudentScreens/AttendeceAll';
import AttendenceList from './TeacherScreens/AttendenceList';
import MarkAttendece from './TeacherScreens/MarkAttendece';
import sendNotification from './TeacherScreens/sendNotification';
import getnotification from './TeacherScreens/getnotification';
const Stack = createNativeStackNavigator();
// import messaging from '@react-native-firebase/messaging';

import { Alert } from 'react-native';
import FullTimetable from './TeacherScreens/FullTimeTable';
import { AlertProvider } from './ControlsAPI/alert';
const App = () => {

  //   useEffect(() => {
  //     const getFCMToken = async () => {
  //       try {
  //         const token = await messaging().getToken();
  //         console.log('FCM Token:', token);
          
  //       } catch (error) {
  //         console.error('Error getting FCM token:', error);
  //       }
  //     };
  
  //     getFCMToken();
  
  // }, []);
  return (
    <AlertProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loader">
        <Stack.Screen name="Loader" component={LoaderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="otpscreen" component={otpscreen} options={{ headerShown: false }} />
        
        <Stack.Screen name="ipChange" component={ipChange} options={{ headerShown: false }} />
        <Stack.Screen name="loginLoader" component={loginLoader} options={{ headerShown: false }} />
        <Stack.Screen name="BottomTabs" component={BottomTabs} options={{ headerShown: false }} />
    {/*............TEACHER..............................  teacher ...............TEACHER ........*/}
        <Stack.Screen name="TeacherTabs" component={TeacherTabs} options={{ headerShown: false }} />
        <Stack.Screen name="FullTimetable" component={FullTimetable} options={{ headerShown: false }} />
        
        <Stack.Screen name="AttendeceAll" component={AttendeceAll} options={{ headerShown: false }} />
       
        <Stack.Screen name="SubjectAttendence" component={SubjectAttendence} options={{ headerShown: false }} />
        <Stack.Screen name="Attendencelist" component={AttendenceList} options={{ headerShown: false }} />
        <Stack.Screen name="MarkAttendence" component={MarkAttendece} options={{ headerShown: false }} />
        <Stack.Screen name="sendnotification" component={sendNotification} options={{ headerShown: false }} />
        <Stack.Screen name="getnotification" component={getnotification} options={{ headerShown: false }} />
      {/*............STUDENT..............................  STUDENT...............STUDENT........*/}
      
      
      
      </Stack.Navigator>
    </NavigationContainer>
    </AlertProvider>
  );
};

export default App;
