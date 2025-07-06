import { 
  StatusBar, 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  ScrollView,
  Platform 
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { API_URL, MyBtn, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import font from '../ControlsAPI/font';
import { RefreshControl } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';

const JAttendenceList = ({ navigation, route }) => {
  const userData = route.params?.userData || {};
  const classData = route.params?.userData;
  const Tid = global.Tid;
  console.log('User Data:', userData);
console.log('User Data:', userData.id);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);


  const [showPreviousAttendanceModal, setShowPreviousAttendanceModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const forceRefresh = () => {
    setRefreshing(true);
    fetchTodayClasses().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchTodayClasses();
  }, []);
useFocusEffect(
  React.useCallback(() => {
     fetchTodayClasses();
  }, [])
);
   const fetchTodayClasses = async () => {
      console.log('im classes today ')
      try {
        setLoading(true);
        setError(null);
    
        const response = await fetch(`${API_URL}/api/JuniorLec/today?teacher_id=${userData.id}`);
  console.log('Response:', response);
        if (!response.ok) {
          const errorData = await response.json(); 
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

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTodayClasses();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  };

   const fetchVenues = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Teachers/venues`);
      const data = await response.json();
      // Format venues according to the API response
      const formattedVenues = data.map(venue => ({
        id: venue.id,
        name: venue.venue
      }));
      setVenues(formattedVenues);
    } catch (error) {
      Alert.alert('Error', 'Failed to load venues');
      console.error('Error fetching venues:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/JuniorLec/your-courses?teacher_id=${Tid}`);
      const data = await response.json();
      console.log('data'+data.data.active_courses)
      // Format active courses according to the API response
      const activeCourses = data.data?.active_courses?.map(course => ({
        id: course.teacher_offered_course_id,
        course_name: course.course_name,
        section: course.section_name,
        course_code: course.course_code
      })) || [];
      setCourses(activeCourses);
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
      console.error('Error fetching courses:', error);
    }
  };

  const handleOpenPreviousAttendance = () => {
    fetchCourses();
    fetchVenues();
    setShowPreviousAttendanceModal(true);
  };

  const handleMarkPreviousAttendance = () => {
    if (!selectedCourse || !selectedVenue) {
      Alert.alert('Error', 'Please select both course and venue');
      return;
    }

    const formattedClassData = {
      teacher_offered_course_id: selectedCourse.id,
      coursename: selectedCourse.course_name,
      venue: selectedVenue.name,
      venue_id: selectedVenue.id,
   
  
fixed_date: selectedDate.toISOString().split('T')[0] + ' ' + selectedTime.toTimeString().substring(0, 8),

      section: selectedCourse.section || 'N/A',
      attendance_status: 'Unmarked'
    };

    navigation.navigate('JAttendanceScreen', { 
      userData,
      classData: formattedClassData,
      refreshList: forceRefresh,
      isUpdate: false
    });

    setShowPreviousAttendanceModal(false);
  };

  const handleClassPress = (classData) => {
    if (classData.attendance_status !== 'Unmarked') {
      Alert.alert(
        'Attendance Already Marked',
        'The attendance for this class has already been marked. Do you want to update it?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Update',
            onPress: () => {
              navigation.navigate('JAttendanceScreen', { 
                userData,
                classData,
                refreshList: forceRefresh(),
                isUpdate: true  
              });
            }
          }
        ]
      );
    } else {
      navigation.navigate('JAttendanceScreen', { 
        userData,
        classData,
        refreshList: forceRefresh(),
        isUpdate: false
      });
    }
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

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const onTimeChange = (event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) setSelectedTime(time);
  };

  return (
    <View style={styles.container}>
      <Navbar 
        title="Mark Attendance" 
        userName={userData.name||classData.name} 
        des={'Teacher'} 
        onLogout={() => navigation.replace('Login')}
      />
      
      <View style={styles.headerRow}>
        <Text style={styles.txt}>Today's Classes</Text>
        <TouchableOpacity 
          style={styles.previousAttendanceButton}
          onPress={handleOpenPreviousAttendance}
        >
          <Text style={styles.previousAttendanceButtonText}>Mark Previous Attendance</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPreviousAttendanceModal}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark Previous Attendance</Text>

            {/* Course Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Course:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedCourse}
                  onValueChange={(itemValue) => setSelectedCourse(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select a course..." value={null} />
                  {courses.map((course) => (
                    <Picker.Item 
                      key={course.id} 
                      label={`${course.course_name} (${course.section})`} 
                      value={course} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Venue Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Venue:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedVenue}
                  onValueChange={(itemValue) => setSelectedVenue(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select a venue..." value={null} />
                  {venues.map((venue) => (
                    <Picker.Item 
                      key={venue.id} 
                      label={venue.name} 
                      value={venue} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Date:</Text>
              <TouchableOpacity 
                style={styles.dateTimeInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>{selectedDate.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            {/* Time Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Time:</Text>
              <TouchableOpacity 
                style={styles.dateTimeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>{selectedTime.toLocaleTimeString()}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPreviousAttendanceModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleMarkPreviousAttendance}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>


      {/* Main Content */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#ffffff', // White background for header
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  txt: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50', // Dark blue-gray
  },
  previousAttendanceButton: {
    backgroundColor: '#3498db', // Bright blue
    padding: 10,
    borderRadius: 5,
    elevation: 3,
  },
  previousAttendanceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  modalContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#2c3e50', // Dark blue-gray
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#34495e', // Slightly darker blue-gray
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#bdc3c7', // Light gray border
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dateTimeInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 15,
  },
  modalButton: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#e74c3c', // Red
  },
  submitButton: {
    backgroundColor: '#2ecc71', // Green
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db', // Blue accent
  },
  classInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2c3e50', // Dark blue-gray
    marginBottom: 6,
  },
  sectionName: {
    fontSize: 15,
    color: '#7f8c8d', // Gray
    marginBottom: 6,
    fontWeight: '500',
  },
  timeVenueContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timeVenue: {
    fontSize: 14,
    color: '#34495e', // Dark gray-blue
    fontWeight: '500',
  },
  statusContainer: {
    alignSelf: 'flex-end',
    padding: 5,
    borderRadius: 4,
    backgroundColor: '#f1f1f1',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#e74c3c', // Red
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    color: '#7f8c8d', // Gray
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
  },
    picker: {
    color: 'black', // Ensures selected value is black
  },
  pickerItem: {
    color: 'black', // Ensures dropdown items are black
  },
  dateTimeText: {
    color: 'black', // Ensures date/time text is black
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: 'black', // Changed to black
    fontSize: 16,
  },
});
export default JAttendenceList;