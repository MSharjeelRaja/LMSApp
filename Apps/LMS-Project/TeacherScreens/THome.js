import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  FlatList,
  StatusBar
} from "react-native";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import Pendingtasks from "../StudentScreens/Pendingtasks";
import CourseContent from "../TeacherScreens/CourseContentMarked";
import { MyBtn, Navbar } from "../ControlsAPI/Comps";
import CreateTaskScreen from "./Createtask";

import MarkAttendece from "./MarkAttendece";
import AntDesign from 'react-native-vector-icons/AntDesign';

import AttendenceList from "./AttendenceList";
import colors from "../ControlsAPI/colors";
AttendenceList


const T_Home = ({ navigation, route }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const isCurrentClass = (start, end) => {
    const extractTime = (time) => {
      if (!time) return NaN;
      
      let [rawHour, minute] = time.split(/[: ]/).map((val, index) => 
        index < 2 ? parseInt(val, 10) : val
      );
      
      let period = time.includes("PM") ? "PM" : "AM"; 
    
      // Convert 12-hour format to 24-hour format for comparison
      let hour = rawHour;
      if (period === "PM" && hour !== 12) hour += 12;  
      if (period === "AM" && hour === 12) hour = 0;
    
      let totalMinutes = hour * 60 + minute; 
      
      return totalMinutes;
    };
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const startTime = extractTime(start);
    const endTime = extractTime(end);
    return currentMinutes >= startTime && currentMinutes <= endTime;
  };
  
  // Properly extract userData from route.params
  const userData = route.params?.userData?.TeacherInfo || {};
  global.tuserid=userData.user_id;
  global.Tid=userData.id;
  console.log("this is user ID in home=="+tuserid + "this is teacher image in home=="+userData.image);

  const timetable = userData.Timetable ? Object.values(userData.Timetable) : [];
  const courseCount = new Set(timetable.map(item => item.coursename)).size;

  return (
    <View style={styles.container}>
     
      <Navbar 
        title="LMS" 
        userName={userData.name} 
        des={route.params?.userData?.Type} 
        onLogout={() => navigation.navigate('Login')}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
        <Image 
    source={{ uri: userData.image }} 
    style={styles.profileImage} 
    resizeMode="cover" 
 
  />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userInfo}>{userData.Username}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Teacher</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>{userData.Session}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.accountButton}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Account Details</Text>
              <Icon name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Timetable Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <View style={styles.timetableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Time</Text>
              <Text style={styles.headerCell}>Course</Text>
              <Text style={styles.headerCell}>Venue</Text>
            </View>
            
            {timetable.length > 0 ? (
              <FlatList
                data={timetable}
                scrollEnabled={false}
                keyExtractor={(item, index) => `${item.start_time}-${item.coursename}-${index}`}
                renderItem={({ item }) => {
                  const isActive = isCurrentClass(item.start_time, item.end_time);
                  return (
                    <View style={[styles.tableRow, isActive && styles.currentClass]}>
                    <Text style={[styles.tableCell, isActive && styles.currentClassText]}>
  {item.start_time.split(":").slice(0, 2).join(":")} - {item.end_time.split(":").slice(0, 2).join(":")}
</Text>

                      <Text style={[styles.tableCell, isActive && styles.currentClassText]}>
                        {item.coursename}
                      </Text>
                      <Text style={[styles.tableCell, isActive && styles.currentClassText]}>
                        {item.venue}
                      </Text>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No classes scheduled for today</Text>
              </View>
            )}
          </View>
        </View>
          
        {/* Course Stats Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.statsContainer}>
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Teaching Load</Text>
              <View style={styles.statsContent}>
                <Text style={styles.statsNumber}>{courseCount}</Text>
                <Text style={styles.statsText}>Courses</Text>
              </View>
            </View>
            
            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Students</Text>
              <View style={styles.statsContent}>
                <Text style={styles.statsNumber}>{userData.StudentCount || 38}</Text>
                <Text style={styles.statsText}>Total</Text>
              </View>
            </View>
          </View>
        </View>
       
   

<View style={styles.con}>
<View style={styles.btncon}>
    <MyBtn 
      title={'Get Notification'} 
      icon={ <AntDesign name="checkcircle" color="white" size={24} />} 
      style={styles.btn} 
      onPress={() => navigation.navigate('getnotification', { userData })} 
    />
    <MyBtn 
      title={'View Student'} 
      icon={ <FontAwesome5 name="user-graduate" color="white" size={24} />} 
      style={styles.btn} 
      onPress={() => navigation.navigate('Attendencelist', { userData })} 
    />
  </View>
  
  <View style={styles.btncon}>
    <MyBtn 
      title={'Mark Attendance'} 
      icon={ <AntDesign name="checkcircle" color="white" size={24} />} 
      style={styles.btn} 
      onPress={() => navigation.navigate('Attendencelist', { userData })} 
    />
    <MyBtn 
      title={'View Student'} 
      icon={ <FontAwesome5 name="user-graduate" color="white" size={24} />} 
      style={styles.btn} 
      onPress={() => navigation.navigate('Attendencelist', { userData })} 
    />
  </View>
  
  <View style={styles.btncon}>
    <MyBtn 
      title={'View Timetable'} 
      icon={ <FontAwesome5 name="calendar-alt" color="white" size={24} />} 
      style={styles.btn} 
      onPress={() => navigation.navigate('FullTimetable', { userData })} 
    />
    <MyBtn 
      title={'Send Notification'} 
      icon={ <FontAwesome5 name="bell" solid color="white" size={24} />} 
      style={styles.btn} 
      onPress={() => navigation.navigate('sendnotification', { userData })} 
    />
  </View>
</View>


        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.eventContainer}>
            <View style={styles.eventCard}>
              <View style={styles.eventDateBadge}>
                <Text style={styles.eventDateDay}>23</Text>
                <Text style={styles.eventDateMonth}>OCT</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>Mid-Term Exam</Text>
                <Text style={styles.eventTime}>
                  <Icon name="event" size={14} color={colors.gray} /> 09:00 AM - 11:00 AM
                </Text>
              </View>
            </View>
            <View style={styles.eventCard}>
              <View style={styles.eventDateBadge}>
                <Text style={styles.eventDateDay}>25</Text>
                <Text style={styles.eventDateMonth}>OCT</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>Faculty Meeting</Text>
                <Text style={styles.eventTime}>
                  <Icon name="event" size={14} color={colors.gray} /> 02:00 PM - 03:30 PM
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const Tab = createBottomTabNavigator();

const TeacherTabs = ({ navigation, route }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          // Use different icon sets based on the tab
          if (route.name === "Home") {
            return <AntDesign name="home" size={size} color={color} />;
          } else if (route.name === "Attendencelist") {
            return <FontAwesome5 name="clipboard-check" size={size} color={color} />;
          } else if (route.name === "Courses") {
            return <FontAwesome5 name="book" size={size} color={color} />;
          } else if (route.name === "CreateTask") {
            return <AntDesign name="pluscircle" size={size} color={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: { 
          backgroundColor: colors.primaryDark, 
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={T_Home} 
        initialParams={route.params} 
      />
      <Tab.Screen 
        name="Attendencelist" 
        component={AttendenceList}  
        initialParams={route.params}
      />
      <Tab.Screen 
        name="Courses" 
        component={CourseContent}  
        initialParams={route.params}
      />
      <Tab.Screen 
        name="CreateTask" 
        component={CreateTaskScreen}  
        options={{ 
          tabBarLabel: "Create Task" 
        }} 
        initialParams={route.params} 
      />
    </Tab.Navigator>
  );
};

export default TeacherTabs;

const styles = StyleSheet.create({
 
    con: {
      flex: 1,
      backgroundColor: colors.grayLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btncon: { 
      flexDirection: 'row', // Arrange buttons in a row
      justifyContent: 'space-around', // Space between buttons
      width: '100%', // Adjust width to fit two buttons
     
    },
    btn: {
      width: 170,
      height: 90,
      justifyContent: 'center',
      alignItems: 'center',
    },

  
  container: { 
    flex: 1, 
    backgroundColor: colors.grayLight
  },
  sectionContainer: {
    marginHorizontal: 11,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 12
  },
  
  // Profile section
  profileCard: { 
    flexDirection: "row", 
    backgroundColor: colors.primaryDark, 
    padding: 10, 
    borderRadius: 16, 
    alignItems: "center", 
    margin: 16,
   
  },
  profileImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 3,
    borderColor:colors.white,
    marginRight: 16 ,top:-5
  },
  profileInfo: { flex: 1 ,marginLeft:10,top:3},
  userName: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: colors.white,
 
  },
  userInfo: { 
    color: colors.white, 
    fontSize: 14,
    opacity: 0.9,
    marginBottom:5
  },
  
  // Badge styles
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 5
  },
  badge: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600'
  },
  
  // Button styles
  accountButton: { 
    backgroundColor: colors.orange, 
    padding: 5, 
    borderRadius: 8, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start'
  },
  buttonText: { 
    color: colors.white,
    fontWeight: '600',
    marginRight: 4
  },
  
  // Timetable styles
  timetableContainer: { 
    backgroundColor: colors.white, 
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 5
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.title,
    fontSize: 15
  },
  tableRow: { 
    flexDirection: "row", 
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 1, 
    borderColor: colors.black,
    alignItems: 'center'
  },
  tableCell: { 
    flex: 1, 
    textAlign: "center", 
    fontSize: 14, 
    color: colors.black 
  },
  currentClass: {
    backgroundColor: colors.blueNavy,
  },
  currentClassText: {
    color: colors.white,
    fontWeight: 'bold'
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center'
  },
  noDataText: {

    color: colors.gray,
    fontSize: 14
  },
  
  // Stats cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    width: '48%',
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.title,
    marginBottom: 5
  },
  
  statsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.title2,
    marginBottom: 4
  },
  statsText: {
    fontSize: 15,
    color: colors.black,opacity:0.8
  },
  
  // Event styles
  eventContainer: {
    marginTop: 8
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  eventDateBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  eventDateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark
  },
  eventDateMonth: {
    fontSize: 12,
    color: colors.primaryDark
  },
  eventDetails: {
    flex: 1
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4
  },
  eventTime: {
    fontSize: 14,
    color: colors.gray
  }
});