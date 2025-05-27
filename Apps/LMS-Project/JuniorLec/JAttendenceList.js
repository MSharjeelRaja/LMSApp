import { StatusBar, StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { API_URL, MyBtn, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import font from '../ControlsAPI/font';
import { RefreshControl } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';

const JAttendenceList = ({ navigation, route }) => {
  const userData = route.params?.userData.TeacherInfo || {};
  const classData = route.params?.userData;
  const Jid = global.Jid;
    const isFocused = useIsFocused();
  
    useEffect(() => {
      if (isFocused) {
        fetchTodayClasses();
      }
    }, [isFocused]);
  
  console.log('Tid: ', Jid);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTodayClasses();
  }, []);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await     fetchTodayClasses();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  };
  const fetchTodayClasses = async () => {
    console.log('im classes today ')
    try {
      setLoading(true);
      setError(null);
  
      const response = await fetch(`${API_URL}/api/JuniorLec/today?teacher_id=${Jid}`);
console.log('Response:', response);
      if (!response.ok) {
        const errorData = await response.json(); // Parse error response if available
        throw new Error(errorData.message || 'Failed to fetch classes');
      }
      
      const data = await response.json();
      console.log('Fetched classes:', data);
      const classesWithIds = data.map((item, index) => ({
        ...item,
        uniqueId: `${item.teacher_offered_course_id}_${index}_${Date.now()}`
      }));
      setClasses(classesWithIds);
     
    } catch (err) {
      console.error('Error fetching today classes:', {
        message: err.message,
        stack: err.stack,
        response: err.response, // If using a custom error object
      });
      setError(err.message || 'Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 // In your class item press handler
const handleClassPress = (selectedClass) => {
  console.log("Navigating with:", { 
    userData: userData, 
    classData: selectedClass 
  });
  
  navigation.navigate('JMarkAttendence', {
    userData: userData,
    classData: selectedClass  // The individual class item from the FlatList
  });
};

// In your Mark Attendance button
<MyBtn 
  title={'Mark Attendance'} 
  onPress={() => navigation.navigate('JMarkAttendence', {
    userData: userData,
    classData: classData  // The main class data from props
  })} 
/>
  const renderClassItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.classCard} 
      onPress={() => handleClassPress(item)}
    >
      <View style={styles.classInfo}>
      
      
        <Text style={styles.courseName}>{item.coursename}</Text> 
        <Text style={styles.sectionName}>{item.section}</Text>
        <View style={styles.timeVenueContainer}>
          <Text style={styles.timeVenue}>
            {item.venue} | {item.start_time} - {item.end_time}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.status, 
            { color: item.attendance_status === 'Unmarked' ? colors.orange : colors.green }
          ]}>
            {item.attendance_status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  

  return (
    <View style={styles.container}>
      <Navbar 
        title="LMS" 
        userName={userData.name||classData.name} 
        des={'Junior Lecturer'} 
        onLogout={() => navigation.replace('Login')}
      />
      
             
      <Text style={styles.txt}>Today's Classes</Text>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <MyBtn title={'Retry'} onPress={fetchTodayClasses} />
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No classes scheduled for today</Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.uniqueId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressBackgroundColor={colors.white}
            />
          }
        />
      )}
      
      <View style={styles.btnContainer}>
        <MyBtn 
          title={'Mark Attendance'} 
          onPress={() => navigation.navigate('MarkAttendence', {userData:classData})} 
        />
      </View>
    </View>
  );
};
      
   

export default JAttendenceList;

const styles = StyleSheet.create({refreshContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  refreshLoader: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  txt: {
    color: colors.black,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    marginBottom: 20,
  },
  btnContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  classCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  classInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
  },
  sectionName: {
    fontSize: 16,
    color: colors.title,
    marginBottom: 8,
  },
  timeVenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 8,
  },
  timeVenue: {
    fontSize: 14,
    color: colors.title,
  },
  statusContainer: {
    alignSelf: 'flex-end',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.red,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  }
});