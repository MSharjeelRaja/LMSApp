import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert, Image,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import { useAlert } from '../ControlsAPI/alert';

const ATTENDANCE_STATUS = {
  PRESENT: 'P',
  ABSENT: 'A'
};

const AttendanceScreen = ({ route, navigation }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [sectionInfo, setSectionInfo] = useState({
    section: '',
    lab: '',
    time: ''
  });
  const alertContext = useAlert();
  
  // Get data from route params
  const classData = route.params?.classData || {};
  const userData = route.params?.userData || {};
  const Tid = global.Tid;
  const teacherOfferedCourseId = classData?.teacher_offered_course_id || 39;
 console.log("Teacher Offered Course ID: " + teacherOfferedCourseId + classData.venue);
  useEffect(() => {
    console.log("Received in Mark Attendance, T ID is == " + Tid);
    console.log("Received in Mark Attendance, Section is == " + classData.section);
    console.log("Teacher Offered Course ID: " + teacherOfferedCourseId);
    
    // Set section info from the classData
    if (classData) {
      setSectionInfo({
        section: classData.section || '',
        lab: classData.venue_name || '',
        time: `${classData.day_slot || ''} ${classData.start_time || ''} - ${classData.end_time || ''}`
      });
    }
    
    fetchStudentList();
  }, []);

  // Only filter when searchQuery changes, not when students changes
  useEffect(() => {
    if (students.length > 0) {
      filterStudents();
    }
  }, [searchQuery]);

  const fetchStudentList = async () => {
    setLoading(true);
    try {
      const data = {
        teacher_offered_course_id: teacherOfferedCourseId,
        venue_name: venue,
      };
  
      const response = await fetch(`${API_URL}/api/Teachers/attendance-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const errorMessage = `HTTP Error: ${response.status} - ${response.statusText}`;
        throw new Error(errorMessage); // Ensure the Error object is correctly instantiated
      }
  
      const adata = await response.json();
      console.log("Students:", adata?.students);
  
      // Validate the API response
      if (!adata.students || !Array.isArray(adata.students)) {
        throw new Error("Invalid response format: students data missing.");
      }
  
      const studentsWithAttendance = adata.students.map(student => ({
        ...student,
        id: student.Student_Id,
        image: student.Student_Image,
        name: student.Student_Name,
        roll_number: student.RegNo,
        percentage: student.Total_Percentage
          ? `${Math.floor(student.Total_Percentage)}%`
          : '0%',
        attendanceStatus: student.attendance_status || ATTENDANCE_STATUS.PRESENT,
      }));
  
      setStudents(studentsWithAttendance);
      setFilteredStudents(studentsWithAttendance);
    } catch (err) {
      console.error("Error fetching students:", err.message || err);
  
      setError('Failed to load student data. Please try again.');
  
      // Mock data for testing if API fails
      const mockStudents = [
        {
          id: 1,
          name: 'Sameer Danish',
          percentage: '65%',
          roll_number: '2021-ARID-4583',
          attendanceStatus: ATTENDANCE_STATUS.PRESENT,
        },
      ];
  
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  };
  
  
  const filterStudents = () => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
  
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    setFilteredStudents(filtered);
  };
  
 
  const toggleAttendance = async (id) => {
    // Log the starting of the function with student ID
    console.log(`Starting toggleAttendance for student ID: ${id}`);
    
    // Find the student by id from students array
    const studentIndex = students.findIndex(student => student.id === id);
    
    if (studentIndex === -1) {
      console.error(`Student with ID ${id} not found`);
      return;
    }
    
    const student = students[studentIndex];
    console.log(`Found student: ${student.name}, Current status: ${student.attendanceStatus}`);
    
    // Toggle the attendance status
    let newStatus;
    if (student.attendanceStatus === ATTENDANCE_STATUS.PRESENT) {
      newStatus = ATTENDANCE_STATUS.ABSENT;
      console.log(`Changing status to ABSENT for student ${student.name} (ID: ${id})`);
    } else {
      newStatus = ATTENDANCE_STATUS.PRESENT;
      console.log(`Changing status to PRESENT for student ${student.name} (ID: ${id})`);
    }
    
    // Create updated student object
    const updatedStudent = {
      ...student,
      attendanceStatus: newStatus
    };
    
    console.log(`Created updated student object with new status: ${newStatus}`);
    
    // Update the students array
    const newStudents = [...students];
    newStudents[studentIndex] = updatedStudent;
    setStudents(newStudents);
    console.log(`Updated main students array`);
    
    // Also update filteredStudents if the student is in that array
    const filteredIndex = filteredStudents.findIndex(s => s.id === id);
    if (filteredIndex !== -1) {
      const newFiltered = [...filteredStudents];
      newFiltered[filteredIndex] = updatedStudent;
      setFilteredStudents(newFiltered);
      console.log(`Updated filtered students array`);
    }
    
    // Only send notification if status is changed to ABSENT
    if (newStatus === ATTENDANCE_STATUS.ABSENT) {
      console.log(`Preparing to send absence notification for student ${student.name}`);
      
      try {
        // Create notification payload
        const notificationData = {
          "title": "Absence Notification",
          "description": "You have been marked absent in today's class",
          "sender": "Teacher",
          "Student_id": id,
          "sender_id": global.tuserid, // Using the teacher ID from route params
        };
        
        console.log(`Notification payload created with:`);
        console.log(`- Student name: ${student.name}`);
        console.log(`- Student ID: ${id}`);
        console.log(`- Teacher ID: ${Tid}`);
        console.log(`Full notification payload: ${JSON.stringify(notificationData)}`);
        
        // Send the notification
        console.log(`Sending notification to API...`);
        const response = await fetch(`${API_URL}/api/student/notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(notificationData)
        });
        
        // Handle the response
        if (response.ok) {
          const responseData = await response.json();
          console.log(`Notification API success response:`, responseData);
         
        } else {
          let errorMessage = 'Failed to send notification';
          try {
            const errorData = await response.json();
            console.error('Notification API error response:', errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            const textResponse = await response.text();
            console.error('Notification API text error response:', textResponse);
          }
          console.error(`Failed to send absence notification. Status: ${response.status}`);
          alertContext.showAlert('error', 'Notification  Unsuccessful');
        }
      } catch (error) {
        console.error(`Error sending notification: ${error.message}`);
        console.error(error.stack);
        alertContext.showAlert('error', 'Network Error');
      }
    }
    
    console.log(`toggleAttendance completed for student ${student.name} (ID: ${id})`);
  };
  
  const submitAttendance = async () => {
    try {
      // Show loading state
      setLoading(true);
      
      // Get current date and time in the requested format
      const currentDate = new Date();
      const formattedDateTime = currentDate.toISOString().slice(0, 10) + ' ' + 
                                currentDate.toTimeString().slice(0, 8);
      
      // Prepare attendance data in the required format
      const attendanceRecords = students.map(student => ({
        student_id: student.Student_Id || student.id,
        teacher_offered_course_id: teacherOfferedCourseId,
        status: student.attendanceStatus.toLowerCase(), // Convert P/A to p/a
        date_time: formattedDateTime,
        isLab: classData.class_type === "Supervised Lab", // Set based on class type
        venue_id: classData.venue_id || 25 // Use actual venue ID from class data
      }));
      
      // Create the payload structure
      const payload = {
        attendance_records: attendanceRecords
      };
      
      console.log('Submitting attendance data:', payload);
      
      // Make the actual API call
      const response = await fetch(`${API_URL}/api/Teachers/attendance/mark-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }
      
      const result = await response.json();
      console.log('Attendance submission result:', result);
      
      alertContext.showAlert('success', 'Attendance Marked Successfully');
      
      // Navigate back after successful submission
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      alertContext.showAlert('error', 'Failed to Submit Attendance');
      console.error('Submit attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage) => {
    const percentageNum = parseInt(percentage);
    if (percentageNum >= 75) return colors.green;
    if (percentageNum < 75) return colors.red;
    return colors.danger;
  };

  const renderStudentItem = ({ item }) => {
    const isPresent = item.attendanceStatus === ATTENDANCE_STATUS.PRESENT;
    const percentageNum = parseInt(item.percentage);
    const hasPerfectAttendance = percentageNum > 89;
    const isLowAttendance = percentageNum < 75;
    return (
      <View style={[
        styles.studentCard, 
        hasPerfectAttendance && styles.perfectAttendance,
        isLowAttendance && styles.red
      ]}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: isPresent ? colors.green : colors.red }
        ]} />
        
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <Image
            source={item.image ? { uri: item.image } : require('../images/as.png')} 
            style={{
              width: 40, 
              height: 40, 
              borderRadius: 40, 
              borderColor: colors.white,
              marginRight: 7
            }} 
          />
          <View>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentRoll}>{item.roll_number}</Text>
          </View>
        </View>
        
        <Text style={[
          styles.percentage, 
          { color: getPercentageColor(item.percentage) }
        ]}>
          {item.percentage}
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.attendanceButton, 
            { backgroundColor: isPresent ? colors.green : colors.red }
          ]}
          onPress={() => toggleAttendance(item.id)}
        >
          <Text style={styles.attendanceButtonText}>
            {isPresent ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Attendance</Text>
    </View>
  );

  const renderSectionInfo = () => (
    <View style={styles.sectionInfoCard}>
      <View style={styles.sectionDetails}>
        <Text style={styles.sectionLabel}>Section: {sectionInfo.section}</Text>
        <Text style={styles.sectionLabel}>Venue: {sectionInfo.lab}</Text>
        <Text style={styles.sectionLabel}>{sectionInfo.time}</Text>
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={styles.legendCon} />
          <Text style={[styles.legendColor, styles.legendText, { backgroundColor: colors.green }]}>{ATTENDANCE_STATUS.PRESENT}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendCon} />
          <Text style={[styles.legendColor, styles.legendText, { backgroundColor: colors.red }]}>{ATTENDANCE_STATUS.ABSENT}</Text>
        </View>
        <View style={styles.headerActionButtons}>
          <TouchableOpacity 
            style={styles.headerActionButton} 
            onPress={() => {
              // Sort students alphabetically
              const sorted = [...filteredStudents].sort((a, b) => 
                a.name.localeCompare(b.name)
              );
              setFilteredStudents(sorted);
            }}
          >
            <Icon name="sort" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerActionButton} 
            onPress={() => navigation.navigate('EnrollStudent')}
          >
            <Icon name="person-add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Icon name="search" size={20} color={colors.secondary} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Find student by name or roll number..."
        value={searchQuery}
        placeholderTextColor={colors.black} 
        onChangeText={setSearchQuery}
      />
    </View>
  );

  const renderSubmitButton = () => (
    <TouchableOpacity 
      style={styles.submitButton} 
      onPress={submitAttendance}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.submitButtonText}>Submit</Text>
      )}
    </TouchableOpacity>
  );

  if (loading && students.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </SafeAreaView>
    );
  }

  if (error && students.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={colors.absent} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudentList}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      {renderHeader()}
      
      <View style={styles.content}>
        {renderSectionInfo()}
        {renderSearchBar()}
        
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={item => (item.id ? item.id.toString() : item.roll_number)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyList}>
              <Icon name="search-off" size={48} color={colors.secondary} />
              <Text style={styles.emptyListText}>No students match your search</Text>
            </View>
          )}
        />
        
        {renderSubmitButton()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grayLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.blue,
    backgroundColor: colors.white,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionInfoCard: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionDetails: {
    flex: 1,
  },
  sectionLabel: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendCon: {},
  legendColor: {
    width: 24,
    height: 24,
    borderRadius: 7,
    marginRight: 4,
  },
  legendText: {
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  headerActionButtons: {},
  headerActionButton: {},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.blueSky,
  },
  searchIcon: {
    marginHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: colors.black,
  },
  listContainer: {
    paddingBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    padding: 9,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.gray,
  },
  perfectAttendance: {
    backgroundColor: colors.greenborder,
    borderColor: colors.Greenborder,
  },
  red: {
    backgroundColor: colors.att70,
    borderColor: colors.attb70,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.black,
  },
  studentRoll: {
    fontSize: 13,
    color: colors.black,
    marginTop: 1,
  },
  percentage: {
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 4,
    color: colors.black,
  },
  attendanceButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.btn,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 19,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyListText: {
    fontSize: 16,
    color: colors.secondary,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default AttendanceScreen;