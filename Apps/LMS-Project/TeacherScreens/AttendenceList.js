import { StatusBar, StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { MyBtn, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import font from '../ControlsAPI/font';

const AttendenceList = ({ navigation, route }) => {
  const userData = route.params?.userData.TeacherInfo || {};
  const classData = route.params?.userData;
  const Tid = global.Tid;
  console.log('Tid: ', Tid);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodayClasses();
  }, []);

  const fetchTodayClasses = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const response = await fetch(`http://192.168.1.15:8000/api/Teachers/today?Teacher_id=${Tid}`);

      if (!response.ok) {
        const errorData = await response.json(); // Parse error response if available
        throw new Error(errorData.message || 'Failed to fetch classes');
      }
      
      const data = await response.json();
      console.log(data);
      
  
    
      setClasses(data);
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
  const handleClassPress = (classData) => {
    navigation.navigate('MarkAttendence', { 
      userData,
      classData 
    });
  };

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
        userName={userData.name} 
        des={'Teacher'} 
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
        keyExtractor={(item) => item.teacher_offered_course_id.toString()} // Use a unique key from the API response
        contentContainerStyle={styles.listContainer}
      />
      
      )}
      
      <View style={styles.btnContainer}>
        <MyBtn 
          title={'Mark Attendance'} 
          onPress={() => navigation.navigate('MarkAttendence', {userData})} 
        />
      </View>
    </View>
  );
};

export default AttendenceList;

const styles = StyleSheet.create({
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
    backgroundColor: colors.card,
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