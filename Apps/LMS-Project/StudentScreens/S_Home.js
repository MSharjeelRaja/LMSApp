import React, { useEffect, useState } from "react";
import Pendingtasks from "./Pendingtasks";
import CourseContent from "./CourseContent";

import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Icon from "react-native-vector-icons/MaterialIcons";
import { Navbar } from "../ControlsAPI/Comps";
import colors from "../ControlsAPI/colors";
import AttendeceAll from "./AttendeceAll";

const Tab = createBottomTabNavigator();

const S_Home = ({ navigation, route }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const isCurrentClass = (start, end) => {
    const extractTime = (time) => {
      if (!time) return NaN; // Prevent errors if time is undefined/null
      
      let [rawHour, minute] = time.split(/[: ]/).map((val, index) => 
        index < 2 ? parseInt(val, 10) : val
      );
      
      let period = time.includes("PM") ? "PM" : "AM"; 
    
      // Convert 12-hour format to 24-hour format for comparison
      let hour = rawHour;
      if (period === "PM" && hour !== 12) hour += 12;  
      if (period === "AM" && hour === 12) hour = 0;
    
      let totalMinutes = hour * 60 + minute; 
      console.log(`Converted ${time} → ${hour}:${minute} (${totalMinutes} min)`);
      
      return totalMinutes;
    };
    
 
    const now = new Date();
    console.log("Current Time:", now.toLocaleString()); // Debugging
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    console.log("Calculated Minutes:", currentMinutes);
    
    const startTime = extractTime(start);
    const endTime = extractTime(end);
    console.log(startTime);
    console.log(endTime);
    console.log(currentMinutes);
    return currentMinutes >= startTime && currentMinutes <= endTime;
  };
  
  
  
  const userData = route.params?.userData?.StudentInfo || {}; 
  const timetable = userData.Timetable ? Object.values(userData.Timetable) : [];
  const courseCount = new Set(timetable.map(item => item.coursename)).size;

  return (
    <View style={styles.container}>
     <Navbar 
  title="LMS" 
  userName={userData.name} 
  des={route.params.userData.Type} 
  onLogout={() => navigation.replace('Login')}
/>

      {/* Profile Section */}
      <View style={styles.profileContainer}>
        <Image 
          source={userData.Image ? { uri: userData.Image } : require('../images/as.png')} 
          style={styles.profileImage} 
        />
        <View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userInfo}>{userData.Program}</Text>
          <Text style={styles.userInfo}>{userData.RegNo}</Text>
          <Text style={styles.userInfo}>CGPA: {userData.CGPA}</Text>
        </View>
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
    console.log(`Checking class: ${item.coursename} from ${item.start_time} to ${item.end_time}`);
            const isActive = isCurrentClass(item.start_time, item.end_time);
            return (
              <View style={[styles.tableRow, isActive && styles.highlight]}>
                <Text style={[styles.tableCell, isActive && styles.highlightText]}>
                  {item.start_time} - {item.end_time}
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

      {/* Course & Result Cards */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Course</Text>
          <Text style={styles.cardText}>You are Enrolled in</Text>
          <Text style={styles.cardNumber}>{userData["Total Enrollments"]}</Text>

          <Text style={styles.cardText}>Courses</Text>
        </View>
        <View style={[styles.card, styles.blueCard]}>
          <Text style={styles.cardTitle}>Result</Text>
          <Text style={styles.cardText}>Your CGPA</Text>
          <Text style={styles.cardNumber}>{userData.CGPA}</Text>
        </View>
      </View>
    </View>
  );
};


const BottomTabs = ({ navigation, route }) => {
  
  return (
  
    <Tab.Navigator
      screenOptions={({ route }) => ({ headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "Tasks") iconName = "assignment";
          else if (route.name === "Courses") iconName = "menu-book";
          else if (route.name === "Attendece") iconName = "library-books";

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.blue, 
        tabBarInactiveTintColor: "gray", 
        tabBarStyle: { backgroundColor: "white", paddingBottom: 5 },
      })}
    >
      <Tab.Screen name="Home" component={S_Home}  initialParams={route.params}/>
      <Tab.Screen name="Tasks" component={Pendingtasks}  initialParams={route.params} />
      <Tab.Screen name="Courses" component={CourseContent}  initialParams={route.params}/>
      <Tab.Screen name="Attendece" component={AttendeceAll}  initialParams={route.params}/>
    </Tab.Navigator>


  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 0 },

  profileContainer: { flexDirection: "row", backgroundColor: "#007BFF", padding: 20,marginHorizontal:12,margin:5, borderRadius: 10, alignItems: "center" },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginRight: 15 },
  userName: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  userInfo: { color: "#fff", fontSize: 16 },

  table: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, overflow: "hidden", marginBottom: 10,height:300 },
  tableRow: { flexDirection: "row", padding: 7, borderBottomWidth: 1, borderColor: 'grey' },
  tableHeader: { backgroundColor: "#007BFF", },
  tableHeaderText: { flex: 1, fontWeight: "bold", textAlign: "center", color: "#fff" },
  tableCell: { flex: 1, textAlign: "center", padding: 0 ,color:'black'},    
  highlight: { backgroundColor: "#FFA500", },
  highlightText: { color:'white', fontWeight: "bold" },

  cardContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  card: { flex: 1, backgroundColor: "#FFA500", padding: 20, borderRadius: 10, marginRight: 10, alignItems: "center" },
  blueCard: { backgroundColor: "#007BFF" },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  cardText: { fontSize: 12, color: "#fff" },
  cardNumber: { fontSize: 30, fontWeight: "bold", color: "#fff" },
});
