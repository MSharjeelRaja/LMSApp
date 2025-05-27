import React, { useEffect, useState } from "react";
import { View, Text,ScrollView, Image, StyleSheet, TouchableOpacity, FlatList, Animated,BackHandler,Modal } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import { AntDesign, FontAwesome5 } from "react-native-vector-icons";
import { Navbar } from "../ControlsAPI/Comps";
import { Title } from "react-native-paper";
import colors from "../ControlsAPI/colors";
import Task from "./Task";
import AttendeceAll from "./AttendeceAll";
import coursecontent from "./CourseContent";
import pendingtaskss from "./Pendingtasks";
import Courses from "./Courses";
import FullTimetable from "./FullTimeTable";
import SubjectAttendence from "./SubjectAttendence";

const Tab = createBottomTabNavigator();

const S_Home = ({ navigation, route }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
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
  const formatTimeTo12Hour = (timeStr) => {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour);
  
    // Custom AM/PM logic
    let ampm = 'AM';
    if (h >= 12 || h <= 7) {
      ampm = 'PM';
    } else if (h >= 8 && h <12 ) {
      ampm = 'AM';
    }
  
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };
  const userData = route.params?.userData || {}; 
  global.sid=userData.id
  console.log('User Data:', userData);
  
  const timetable = userData.Reschedule ? Object.values(userData.Reschedule) : 
                    userData.Timetable ? Object.values(userData.Timetable) : [];
  const courseCount = new Set(timetable.map(item => item.coursename)).size;

  return (
    <ScrollView>
    <View style={styles.container}>
      <Navbar 
        title="LMS" 
        userName={userData.name} 
        des={'Student'} 
        onLogout={() => navigation.replace('Login')}
      />

<View style={styles.profileContainer}>
  <Image 
    source={userData.Image ? { uri: userData.Image } : require('../images/as.png')} 
    style={styles.profileImage}
    resizeMode="cover" 
  />
  
  <View style={styles.profileInfo}>
    <Text style={styles.userName}>{userData.name}</Text>

    {/* 🔔 Bell Icon aligned with student name */}
    <TouchableOpacity 
      onPress={() => navigation.navigate('notification',userData)}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 8,
      }}
    >
      
      <Icon name="notifications" size={25} color="white" />
    </TouchableOpacity>

    <Text style={styles.userInfo}>{userData.Program}</Text>
    <Text style={styles.userInfo}>{userData.RegNo}</Text>
    <Text style={styles.userInfo}>CGPA: {userData.CGPA}</Text>
    
    <View style={styles.buttonContainer}>
      {userData["Is Grader ?"] && (
        <TouchableOpacity 
          style={styles.graderButton}
          onPress={() => navigation.navigate('grader',userData)}>
          <Text style={styles.buttonText}>Switch to Grader</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => setIsModalVisible(true)}>
        <Text style={styles.buttonText}>View Info</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>


      {/* Timetable Section */}
      <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate("FullTimetables", { userData })}
            >

              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableHeaderText}>Time</Text>
          <Text style={styles.tableHeaderText}>Course</Text>
          <Text style={styles.tableHeaderText}>Venue</Text>
        </View>
        <FlatList
          data={timetable}
          keyExtractor={(item) => item.start_time + item.coursename}
          renderItem={({ item }) => {
            const isActive = isCurrentClass(item.start_time, item.end_time);
            return (
              <View style={[styles.tableRow, isActive && styles.highlight]}>
              <Text style={[styles.tableCell, isActive && styles.highlightText]}>
                {`${formatTimeTo12Hour(item.start_time)}\n${formatTimeTo12Hour(item.end_time)}`}
              </Text>
            
             
            
            
              <Text style={[styles.tableCell, isActive && styles.highlightText]}>
                {item.coursename}
              </Text>
            
              <Text style={[styles.tableCell, isActive && styles.highlightText]}>
                {item.venue}
              </Text>
            </View>
            
            );
          }}
        />
      </View>
      {userData.Notice && (
    <Text style={styles.rescheduleNotice}>{userData.Notice}</Text>
  )}
 <Modal
    animationType="slide"
    transparent={true}
    visible={isModalVisible}
    onRequestClose={() => setIsModalVisible(false)}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <ScrollView>
          <Text style={styles.modalTitle}>Student Details</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>{userData.Gender}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Guardian:</Text>
            <Text style={styles.infoValue}>{userData.Guardian}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Intake:</Text>
            <Text style={styles.infoValue}>{userData.InTake}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Session:</Text>
            <Text style={styles.infoValue}>{userData["Current Session"]}</Text>
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>

     
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Course</Text>
          <Text style={styles.cardText}>You are Enrolled in</Text>
          <Text style={styles.cardNumber}>{userData["Total Enrollments"] || 0}</Text>
          <Text style={styles.cardText}>Courses</Text>
        </View>
        <View style={[styles.card, styles.blueCard]}>
          <Text style={styles.cardTitle}>Result</Text>
          <Text style={styles.cardText}>Your CGPA</Text>
          <Text style={styles.cardNumber}>{userData.CGPA || "N/A"}</Text>
        </View>
      </View>
     {/* Action Buttons Section */}
<View style={styles.actionButtonsContainer}>
  {/* First Row */}
  <View style={styles.buttonRow}>
    <TouchableOpacity 
      style={[styles.actionButton, styles.examButton]}
      onPress={() => navigation.navigate('Exam', { userData })}
    >
      <Icon name="assignment" size={24} color="white" />
      <Text style={styles.actionButtonText}>Exams</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.actionButton, styles.attendanceButton]}
      onPress={() => navigation.navigate('Attendance', { userData })}
    >
      <Icon name="library-books" size={24} color="white" />
      <Text style={styles.actionButtonText}>Attendance</Text>
    </TouchableOpacity>
  </View>

  {/* Second Row */}
  <View style={styles.buttonRow}>
    <TouchableOpacity 
      style={[styles.actionButton, styles.tasksButton]}
      onPress={() => navigation.navigate('sTask', { userData })}
    >
      <Icon name="check-circle" size={24} color="white" />
      <Text style={styles.actionButtonText}>Tasks</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.actionButton, styles.materialsButton]}
      onPress={() => navigation.navigate('Courses', { userData })}
    >
      <Icon name="menu-book" size={24} color="white" />
      <Text style={styles.actionButtonText}>Materials</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={[styles.actionButton, styles.materialsButton]}
      onPress={() => navigation.navigate('ConsideredTasks', { userData })}
    >
      <Icon name="menu-book" size={24} color="white" />
      <Text style={styles.actionButtonText}>Considered Tasks</Text>
    </TouchableOpacity>
  </View>
</View>
    </View>
    </ScrollView>
  );
  
};



const BottomTabs = ({ navigation, route }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Task") iconName = "assignment";
          else if (route.name === "Courses") iconName = "menu-book";
          else if (route.name === "Attendance") iconName = "library-books";

          
          return (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Icon name={iconName} size={size} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      })}
    >
      <Tab.Screen name="Home" component={S_Home} initialParams={route.params}/>
     
      <Tab.Screen name="Courses" component={Courses} initialParams={route.params}/>
      <Tab.Screen name="Attendance" component={AttendeceAll} initialParams={route.params}/>
      <Tab.Screen name="Task" component={Task} initialParams={route.params}/>
    </Tab.Navigator>
  );
};

export default BottomTabs;


const styles = StyleSheet.create({
  actionButtonsContainer: {
    marginHorizontal: 12,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3,
    marginHorizontal: 5,
  },
  examButton: {
    backgroundColor: '#FF6B6B', // Coral red
  },
  attendanceButton: {
    backgroundColor: '#4ECDC4', // Teal
  },
  tasksButton: {
    backgroundColor: '#45B7D1', // Sky blue
  },
  materialsButton: {
    backgroundColor: '#A78BFA', // Light purple
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.bg, 
   
  },
  
  // Profile Section
  profileContainer: { 
    flexDirection: "row", 
    backgroundColor: colors.primary, 
    padding: 10, 
    marginHorizontal: 12, 
    margin: 10, 
    borderRadius: 15, 
    alignItems: "center",
    elevation: 5,
  },
  profileImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.white
  },
  profileInfo: {
    flex: 1,
  },
  userName: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: colors.white, 
    marginBottom: 3 
  },
  userInfo: { 
    color: colors.white, 
    fontSize: 14,
    marginBottom: 2 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  // Section Titles
  sectionTitle: {
    paddingHorizontal: 15,
    marginTop: 10,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 5,color: colors.primary,
  },
 
  
  // Table Styles
  table: { 
    borderWidth: 1, 
    borderColor: colors.primary, 
    borderRadius: 10, 
    overflow: "hidden", 
    marginHorizontal: 12,
    marginBottom: 15,
    minHeight: 100,
 
    backgroundColor: colors.white,
    elevation: 3,
  },
  tableRow: { 
    flexDirection: "row", 
    padding: 10, 
    borderBottomWidth: 1, 
    borderColor: '#e5e5e5' 
  },
  tableHeader: { 
    backgroundColor: colors.primary, 
  },
  tableHeaderText: { 
    flex: 1, 
    fontWeight: "bold", 
    textAlign: "center", 
    color: colors.white,
    fontSize: 14
  },
  tableCell: { 
    flex: 1, 
    textAlign: "center", 
    fontSize: 13,
    color: colors.dark
  },    
  highlight: { 
    backgroundColor: colors.blueNavy, 
  },
  highlightText: { 
    color: colors.white, 
    fontWeight: "bold" 
  },
  
  // Card Styles
  cardContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginHorizontal: 12,
    marginBottom: 20
  },
  card: { 
    flex: 1, 
    backgroundColor: colors.warning, 
    padding: 15, 
    borderRadius: 15, 
    marginRight: 10, 
    alignItems: "center",
    elevation: 4,
  },
  blueCard: { 
    backgroundColor: colors.primary,
    marginRight: 0,
    marginLeft: 10,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: colors.white,
    marginBottom: 5
  },
  cardText: { 
    fontSize: 12, 
    color: colors.white,
    opacity: 0.9
  },
  cardNumber: { 
    fontSize: 32, 
    fontWeight: "bold", 
    color: colors.white,
    marginVertical: 5
  },
  
  // Tab Bar Styles
  tabBarStyle: {
    backgroundColor: colors.primaryDark,
    height: 60,
    paddingBottom: 10,
    paddingTop: 5,
    borderTopWidth: 0,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight:16,
    backgroundColor: colors.primaryLight,
    
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
   
   
    marginTop: 6,
  },
  floatingButtonContainer: {
    position: "absolute",
    top: -25,
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
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  graderButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  infoButton: {
    backgroundColor: colors.info,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  rescheduleNotice: {
    color: 'red',
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: -10,
    marginBottom: 10,
   
    textAlign:'center',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontWeight: '600',
    color: colors.dark,
    width: '23%',
  },
  infoValue: {
    color: colors.black,
  
    width: '63%',
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});