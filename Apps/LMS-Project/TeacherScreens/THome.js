import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  FlatList,
  StatusBar,
  BackHandler
} from "react-native";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import Pendingtasks from "../StudentScreens/Pendingtasks";
import CourseSections from "./CourseSections";
import { MyBtn, Navbar } from "../ControlsAPI/Comps";

import { Title } from "react-native-paper";
import MarkAttendece from "./MarkAttendece";
import AntDesign from 'react-native-vector-icons/AntDesign';
import AttendenceList from "./AttendenceList";
import Courses from "./Courses";
import colors from "../ControlsAPI/colors";
import Createtask from "./Createtask";
import taskget from "./taskget";
const T_Home = ({ navigation, route }) => {
  useEffect(() => {
    const handleBackPress = () => {
      if (navigation.isFocused()) {
        navigation.replace('Login');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [navigation]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isCurrentClass = (start, end) => {
    // Convert API times to minutes (24h format)
    const toMinutes = (time) => {
      const [h, m] = time.slice(0, 5).split(':').map(Number);
      return h * 60 + m;
    };
  
    // Get current time with 12h-24h fix
    const now = new Date();
    let hours = now.getHours();
    const isPM = hours >= 12;
    
    // Convert to proper 24h format if system clock is misconfigured
    if (isPM && hours > 12) hours -= 12;
    if (!isPM && hours === 0) hours = 12;
  
    const currentMinutes = hours * 60 + now.getMinutes();
  
    // Compare with class times
    return currentMinutes >= toMinutes(start) && currentMinutes <= toMinutes(end);
  };
 
  const userData = route.params?.userData || {};
  global.tuserid = userData.user_id;
  global.Tid = userData.id;

  const timetable = userData.Timetable ? Object.values(userData.Timetable) : [];
  // const courseCount = new Set(timetable.map(item => item.coursename)).size;
  // const secCount = new Set(timetable.map(item => item.section)).size;


  const formatDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return currentTime.toLocaleDateString('en-US', options);
  };

  // Quick action buttons data
  const quickActions = [
    {
      id: 1,
      title: "Notifications",
      icon: "notification",
      iconType: "AntDesign",
      color: colors.primary,
      onPress: () => navigation.navigate("getnotification", { userData })
    },
    {
      id: 2,
      title: "Courses",
      icon: "book",
      iconType: "AntDesign",
      color: colors.info,
      onPress: () => navigation.navigate("Courses", { userData })
    },
    {
      id: 3,
      title: "Contested",
      icon: "exclamation-triangle",
      iconType: "FontAwesome5",
      color: colors.warning,
      onPress: () => navigation.navigate("Contestattendence", { userData })
    },
    {
      id: 4,
      title: "Students",
      icon: "users",
      iconType: "FontAwesome5",
      color: colors.success,
      onPress: () => navigation.navigate("Attendencelist", { userData })
    },
    
    {
      id: 5,
      title: "View Tasks",
      icon: "assignment",
      iconType: "MaterialIcons",
      color: colors.orange,
      onPress: () => navigation.navigate("taskget", { userData })
    },   {
      id: 6,
      title: "Assign task",
      icon: "assignment",
      iconType: "MaterialIcons",
      color: colors.orange,
      onPress: () => navigation.navigate("Createtask", { userData })
    },   {
      id: 7,
      title: "Consider Tasks",
      icon: "assignment",
      iconType: "MaterialIcons",
      color: colors.orange,
      onPress: () => navigation.navigate("ConsiderTask", { userData })
    },   {
      id: 8,
      title: "Graders",
      icon: "assignment",
      iconType: "MaterialIcons",
      color: colors.blueNavy,
      onPress:() => navigation.navigate("Grader", { userData })
    }
    
           
            
  ];
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.replace('Login');
      return true; // Prevent default back behavior
    });
  
    return () => backHandler.remove(); // Cleanup on unmount
  }, [navigation]);
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
     
      <Navbar 
        title="LMS" 
        userName={userData.name} 
        des={'Teacher'} 
        onLogout={() => navigation.navigate('Login')}
      />
      
  
       
        <View style={styles.profileCard}>
          
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: userData.image }} 
              style={styles.profileImage} 
              resizeMode="cover"
            />
          </View>
          
          <View style={styles.profileInfo}>
          <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>
        
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userInfo}>{userData.Username}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Teacher</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.info }]}>
                <Text style={styles.badgeText}>{userData.Session}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.accountButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Details", { userData })}
            >
              <Text style={styles.buttonText}>Account Details</Text>
              <Icon name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Course Stats Cards */}
        {/* <View style={styles.statsCardsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <FontAwesome5 name="book" size={24} color={colors.primary} />
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>{courseCount}</Text>
              <Text style={styles.statsLabel}>Courses</Text>
            </View>
          </View>
          
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <FontAwesome5 name="users" size={24} color={colors.info} />
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsNumber}>{secCount || 4}</Text>
              <Text style={styles.statsLabel}>Sections</Text>
            </View>
          </View>
        </View>
         */}
      
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("FullTimetable", { userData })}
            >

              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
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
                <FontAwesome5 name="calendar-times" size={24} color={colors.gray} style={styles.noDataIcon} />
                <Text style={styles.noDataText}>No classes scheduled for today</Text>
              </View>
            )}
          </View>
        </View>
       
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <ScrollView 
              nestedScrollEnabled={true}
              style={styles.quickActionsScroll}
              contentContainerStyle={styles.quickActionsScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionButton}
                    onPress={action.onPress}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                      {action.iconType === "AntDesign" && (
                        <AntDesign name={action.icon} size={22} color={colors.white} />
                      )}
                      {action.iconType === "FontAwesome5" && (
                        <FontAwesome5 name={action.icon} size={22} color={colors.white} />
                      )}
                      {action.iconType === "MaterialIcons" && (
                        <Icon name={action.icon} size={22} color={colors.white} />
                      )}
                    </View>
                    <Text style={styles.actionButtonText}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      
      
     
    </View>
  );
};


import {  Animated } from 'react-native';
import AddContent from "./AddContent";

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ focused, name, size, color, iconFamily }) => {

  

  return (
    <Animated.View
      style={{
        alignItems: "center",
        justifyContent: "center",
        
    
      }}
    >
      {iconFamily === "AntDesign" ? (
        <AntDesign name={name} size={24} color={color} />
      ) : (
        <FontAwesome5 name={name} size={22} color={color} />
      )}
      {focused && <View style={styles.activeIndicator} />}
    </Animated.View>
  );
};

const TeacherTabs = ({ navigation, route }) => {
  const userData = route.params?.userData || {};
console.log('id is ='+userData.id)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName, iconFamily;

          if (route.name === "Home") {
            iconName = "home";
            iconFamily = "AntDesign";
          } else if (route.name === "Attendencelist") {
            iconName = "clipboard-check";
            iconFamily = "FontAwesome5";
          } else if (route.name === "Course Content") {
            iconName = "book";
            iconFamily = "FontAwesome5";
          }
          else if (route.name === "Courses") {
            iconName = "book";
            iconFamily = "FontAwesome5";
          }
          return (
            <TabBarIcon
              focused={focused}
              name={iconName}
              size={22}
              color={color}
              iconFamily={iconFamily}
            />
          );
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      })}
    >
      <Tab.Screen name="Home" component={T_Home} initialParams={route.params} />
      <Tab.Screen
        name="Attendencelist"
        component={AttendenceList}
        initialParams={route.params}
      />

      {/* Center Floating Button */}
      <Tab.Screen
        name="AddContent"
        component={AddContent}
     
        options={{
          tabBarLabel: "",
          
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={styles.floatingButtonContainer}
              onPress={() => navigation.navigate("AddContent", { userData })}
            >
              <View style={styles.floatingIcon}>
                <AntDesign name="plus" size={26} color={colors.white} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name="Course Content"
        component={CourseSections}
        initialParams={route.params}
      /> 
       <Tab.Screen
      name="Courses"
      component={Courses}
      initialParams={route.params}
    />
    </Tab.Navigator>
  );
};

export default TeacherTabs;

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: colors.primaryDark,
    height: 60,
    paddingBottom: 10,
    paddingTop: 5,
    borderTopWidth: 0,
    elevation: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 0,
   
    marginTop: 3,
  },
  floatingButtonContainer: {
    position: "absolute",
    top: -20, // Keeps button properly aligned
    width: 70,
    height: 60,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingIcon: {
    backgroundColor: colors.secondary,
    width: 55,
    height: 55,
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
   
  },
  
  









  container: { 
    flex: 1, 
    backgroundColor: colors.primaryFaint,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Date Header
  dateHeader: {
left:-120,
  },
  dateText: {
    fontSize: 14,
    color: colors.blueLight,
    fontWeight: '600',
  },
  
  // Profile Card
  profileCard: { 
    flexDirection: "row", 
    backgroundColor: colors.primaryDark, 
    padding: 12, 
    borderRadius: 16, 
    alignItems: "center", 
    margin: 7,
    marginTop:4,
    elevation: 4,
  },
  profileImageContainer: {
    borderRadius: 45,
    padding: 2,
    backgroundColor: colors.white,
    elevation: 2,
  },
  profileImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
  },
  profileInfo: { 
    flex: 1,
    marginLeft: 36,
  },
  userName: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: colors.white,
  },
  userInfo: { 
    color: colors.white, 
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4
  },
  
  // Badge styles
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 5
  },
  badge: {
    backgroundColor: colors.blueNavy,
    paddingVertical: 4,
    paddingHorizontal: 10,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  
  // Stats Cards
  statsCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 5,
    width: '48%',
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIconContainer: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.primaryFaint,
    marginRight: 17,
  },
  statsContent: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.title2,
   textAlign: 'center',
   marginRight: 45,
  },
  statsLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  
  // Section Container
  sectionContainer: {
    marginHorizontal: 10,
    marginBottom: 13,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    elevation: 4,
 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Timetable styles
  timetableContainer: { 
    backgroundColor: colors.white, 
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.primaryDark,
    fontSize: 14,
  },
  tableRow: { 
    flexDirection: "row", 
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderBottomWidth: 1, 
    borderColor: colors.primaryFaint,
    alignItems: 'center',
  },
  tableCell: { 
    flex: 1, 
    textAlign: "center", 
    fontSize: 14, 
    color: colors.black,
  },
  currentClass: {
    backgroundColor: colors.blueNavy,
  },
  currentClassText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  noDataContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noDataIcon: {
    marginBottom: 8,
  },
  noDataText: {
    color: colors.gray,
    fontSize: 14,
  },
  
  // Quick Actions Section - UPDATED
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 10,
    marginBottom: 16,
    elevation: 4,
    
  },
  quickActionsContainer: {
    marginTop: 10,
    height: 240, // Fixed height for the scrollable container
  },
  quickActionsScroll: {
    flex: 1,
  },
  quickActionsScrollContent: {
    paddingRight: 8, // Add padding for the scrollbar
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%', // Two buttons per row
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonText: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  
  // Grader Buttons
  graderButtonsScrollContainer: {
    paddingVertical: 15,
  },
  graderButton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 120,
  },
  graderButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});