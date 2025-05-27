import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoaderScreen from './login/Loader';
import LoginScreen from './login/login';
import grader from './Grader/grader';
import loginLoader from './login/loginLoader';
import BottomTabs from './StudentScreens/S_Home';
import ipChange from './ControlsAPI/ipChange';
import Grader from './TeacherScreens/GradersAll';
import TeacherTabs from './TeacherScreens/THome';
import SubjectAttendence from './StudentScreens/SubjectAttendence';
import AttendeceAll from './StudentScreens/AttendeceAll';
import AttendenceList from './TeacherScreens/AttendenceList';
import MarkAttendece from './TeacherScreens/MarkAttendece';
import sendNotification from './TeacherScreens/sendNotification';
import Details from './TeacherScreens/Details';

import getnotification from './TeacherScreens/getnotification';




import CourseContent from './StudentScreens/CourseContent';

const Stack = createNativeStackNavigator();
// import messaging from '@react-native-firebase/messaging';
import home from './JuniorLec/home'
import { Alert } from 'react-native';
import FullTimetable from './TeacherScreens/FullTimeTable';
import { AlertProvider } from './ControlsAPI/alert';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Contestattendence from './TeacherScreens/Contestattendence';
import Courses from './TeacherScreens/Courses';
import CourseSections from './TeacherScreens/CourseSections';
import CourseContentMarked from './TeacherScreens/CourseContentMarked';
import CreateTaskScreen from './TeacherScreens/Createtask';
import AddContent from './TeacherScreens/AddContent';
import Createtask from './TeacherScreens/Createtask';
import taskget from './TeacherScreens/taskget';
import ViewSubmissions from './TeacherScreens/ViewSubmissions';
//Junior Imports
import JTabs from './JuniorLec/home';
import JTimetable from './JuniorLec/JTimeTable';
import Jnotification from './JuniorLec/Jnotification';
import JAttendenceList from './JuniorLec/JAttendenceList';
import JContestattendence from './JuniorLec/JContestattendence';
import JMarkAttendence from './JuniorLec/JMarkAttendece';
import AddseatingPlan from './JuniorLec/AddseatingPlan';

import JDetails from './JuniorLec/JDetails';
import JCreatetask from './JuniorLec/JCreatetask';
import Tasks from './Grader/Tasks';
import JCourses from './JuniorLec/JCourses';
import Jtaskget from './JuniorLec/Jtaskget';

import JAddContent from './JuniorLec/JAddContent';
import FullTimetables from './StudentScreens/FullTimeTable';
import submittask from './StudentScreens/submittask';
import notification from './StudentScreens/Notification';
import Tasksubmit from './StudentScreens/Tasksubmit'
import SCourses from './StudentScreens/Courses';
import Exam from './StudentScreens/Exam';
import Task from './StudentScreens/Task';
import ConsiderTask from './TeacherScreens/ConsiderTask';
import ConsideredTasks from './StudentScreens/ConsideredTasks';
const App = () => {

 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AlertProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loader">
        <Stack.Screen name="Loader" component={LoaderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        
        <Stack.Screen name="ipChange" component={ipChange} options={{ headerShown: false }} />
        <Stack.Screen name="loginLoader" component={loginLoader} options={{ headerShown: false }} />
        <Stack.Screen name="BottomTabs" component={BottomTabs} options={{ headerShown: false }} />
    {/*............TEACHER..............................  teacher ...............TEACHER ........*/}
        <Stack.Screen name="TeacherTabs" component={TeacherTabs} options={{ headerShown: false }} />
        <Stack.Screen name="FullTimetable" component={FullTimetable} options={{ headerShown: false }} />
        <Stack.Screen name="Contestattendence" component={Contestattendence} options={{ headerShown: false }} />
        <Stack.Screen name="AttendeceAll" component={AttendeceAll} options={{ headerShown: false }} />
        <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CourseContentMarked" component={CourseContentMarked} options={{ headerShown: false }} />
        <Stack.Screen name="Courses" component={Courses} options={{ headerShown: false }} />
        <Stack.Screen name="Grader" component={Grader} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={Details} options={{ headerShown: false }} />
        <Stack.Screen name="SubjectAttendence" component={SubjectAttendence} options={{ headerShown: false }} />
        <Stack.Screen name="Attendencelist" component={AttendenceList} options={{ headerShown: false }} />
        <Stack.Screen name="MarkAttendence" component={MarkAttendece} options={{ headerShown: false }} />
        <Stack.Screen name="sendnotification" component={sendNotification} options={{ headerShown: false }} />
        <Stack.Screen name="getnotification" component={getnotification} options={{ headerShown: false }} />

        <Stack.Screen name="AddContent" component={AddContent} options={{ headerShown: false }} />
    
        <Stack.Screen name="ConsiderTask" component={ConsiderTask} options={{ headerShown: false }} />  
        <Stack.Screen name="ViewSubmissions" component={ViewSubmissions} options={{ headerShown: false }} />
        <Stack.Screen name="taskget" component={taskget} options={{ headerShown: false }} />
        <Stack.Screen name="Jtaskget" component={Jtaskget} options={{ headerShown: false }} />
        <Stack.Screen name="grader" component={grader} options={{ headerShown: false }} />

        <Stack.Screen name="JAddContent" component={JAddContent} options={{ headerShown: false }} />

        <Stack.Screen name="Createtask" component={Createtask} options={{ headerShown: false }} />





      {/*............STUDENT..............................  STUDENT...............STUDENT........*/}
      <Stack.Screen name="submitask" component={submittask} options={{ headerShown: false }} />
      <Stack.Screen name="FullTimetables" component={FullTimetables} options={{ headerShown: false }} />
     
      <Stack.Screen name="ConsideredTasks" component={ConsideredTasks} options={{ headerShown: false }} />
      <Stack.Screen name="notification" component={notification} options={{ headerShown: false }} />
      <Stack.Screen name="Tasksubmit" component={Tasksubmit} options={{ headerShown: false }} />
      <Stack.Screen name="CourseContent" component={CourseContent} options={{ headerShown: false }} />
      
      <Stack.Screen name="sTask" component={Task} options={{ headerShown: false }} />
      
      <Stack.Screen name="Exam" component={Exam} options={{ headerShown: false }} />
      <Stack.Screen name="SCourses" component={SCourses} options={{ headerShown: false }} />

       {/*...........GRADER..............................GRADER...............GRADER.......*/}
      <Stack.Screen name="Tasks" component={Tasks} options={{ headerShown: false }} />
      





      
       {/*...........JUNIOR.............................. JUNIOR...............JUNIOR........*/}
      
       <Stack.Screen name="home" component={home} options={{ headerShown: false }} />
       <Stack.Screen name="JTimetable" component={JTimetable} options={{ headerShown: false }} />
       <Stack.Screen name="JTabs" component={JTabs} options={{ headerShown: false }} />
       <Stack.Screen name="Jnotification" component={Jnotification} options={{ headerShown: false }} />
      
        <Stack.Screen name="AddseatingPlan" component={AddseatingPlan} options={{ headerShown: false }} />

        <Stack.Screen name="JAttendenceList" component={JAttendenceList} options={{ headerShown: false }} />
      
        <Stack.Screen name="JContestattendence" component={JContestattendence} options={{ headerShown: false }} />
        <Stack.Screen name="JMarkAttendence" component={JMarkAttendence} options={{ headerShown: false }} />
        <Stack.Screen name="JDetails" component={JDetails} options={{ headerShown: false }} />
        <Stack.Screen name="JCourses" component={JCourses} options={{ headerShown: false }} />
        
        <Stack.Screen name="JCreatetask" component={JCreatetask} options={{ headerShown: false }} />
        

      </Stack.Navigator>
    </NavigationContainer>
    </AlertProvider>
    </GestureHandlerRootView>
  );
};

export default App;
