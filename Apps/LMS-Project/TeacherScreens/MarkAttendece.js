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
  Image,
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
fd=classData.fixed_date;
  console.log('class data is '+classData )
  console.log('fd '+fd )
  const Tid = global.Tid;
  const teacherOfferedCourseId = classData?.teacher_offered_course_id || 39;
 console.log("Teacher Offered Course ID: " + teacherOfferedCourseId + classData.venue);
  useEffect(() => {

  
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
        venue_name: classData.venue,
      };
  console.log( 'fetched list '+data)
      const response = await fetch(`${API_URL}/api/Teachers/attendance-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      console.log(response)
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
        id: student.student_id,
        image: student.Student_Image,
        name: student.name,
        roll_number: student.RegNo,
        percentage: student.percentage
  ,
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
    
  
    if (newStatus === ATTENDANCE_STATUS.ABSENT) {
      console.log(`Preparing to send absence notification for student ${student.name}`);
      
      try {
      
        const notificationData = {
          "title": "Absence Notification",
          "description": "You have been marked absent in today's class",
          "sender": "Teacher",
          "Student_id": id,
          "sender_id": global.tuserid, 
        };
        
        console.log(`Notification payload created with:`);
        console.log(`- Student name: ${student.name}`);
        console.log(`- Student ID: ${id}`);
        console.log(`- Teacher ID: ${Tid}`);
        console.log(`Full notification payload: ${JSON.stringify(notificationData)}`);
        
      
        console.log(`Sending notification to API...`);
        const response = await fetch(`${API_URL}/api/student/notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(notificationData)
        });
        
        
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
      console.log('Submitting attendance '+fd);
      
      // Prepare attendance data in the required format
      const attendanceRecords = students.map(student => ({
        student_id: student.Student_Id || student.id,
        teacher_offered_course_id: teacherOfferedCourseId,
        status: student.attendanceStatus.toLowerCase(), // Convert P/A to p/a
        date_time: fd,
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
    if (percentageNum >= 90) return colors.green4;
    if (percentageNum < 90 && percentageNum >=75) return colors.black;
    if (percentageNum < 75) return colors.red2;
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
          { backgroundColor: isPresent ? colors.green : colors.red1}
        ]} />
        
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <Image
            source={item.image ? { uri: item.image } : require('../images/as.png')} 
            style={{
              width: 30, 
              height: 30, 
              borderRadius: 40, 
              borderColor: colors.white,
              marginRight: 4
            }} 
          />
          <View>
          <Text style={styles.studentName}>
  {item.name.startsWith("Muhammad") ? item.name.replace("Muhammad", "M") : item.name}
</Text>

            <Text style={styles.studentRoll}>{item.roll_number}</Text>
          </View>
        </View>
        
        <Text style={[
  styles.percentage, 
  { color: getPercentageColor(item.percentage) }
]}>
  {parseFloat(item.percentage).toFixed(1) + '%'}
</Text>
        
        <TouchableOpacity 
          style={[
            styles.attendanceButton, 
            { backgroundColor: isPresent ? colors.green : colors.red1 }
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
    <View style={styles.sectionContainer}>
      {/* First Row - Section Details and P/A Buttons */}
      <View style={styles.sectionDetailsRow}>
        <View style={styles.sectionTextDetails}>
          <Text style={styles.sectionLabel}>Section: {classData.section}</Text>
          <Text style={styles.sectionLabel}>Venue: {classData.venue}</Text>
          <Text style={styles.sectionLabel}>{classData.start_time + ' - '+ classData.end_time}</Text>
        </View>
        
        {/* P/A Buttons Legend */}
        <View style={styles.attendanceLegendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.green }]} />
            <Text style={styles.legendText}>{ATTENDANCE_STATUS.PRESENT}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, { backgroundColor: colors.red1 }]} />
            <Text style={styles.legendText}>{ATTENDANCE_STATUS.ABSENT}</Text>
          </View>
        </View>
      </View>
  
      {/* Second Row - Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonLast]}
          onPress={() => {
            const sorted = [...filteredStudents].sort((a, b) => 
              a.name.localeCompare(b.name)
            );
            setFilteredStudents(sorted);
          }}
        >
          <Icon name="sort" size={18} color={colors.primary} />
          <Text style={styles.actionButtonText}>Sort</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('EnrollStudent')}
        >
          <Icon name="person-add" size={18} color={colors.primary} />
          <Text style={styles.actionButtonText}>Enroll</Text>
        </TouchableOpacity>
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
    <View style={styles.submitButtonContainer}>
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={submitAttendance}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
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
    backgroundColor:colors.primaryLight,
    padding: 8,
  },
 
    // Section Container Styles
    sectionContainer: {
      backgroundColor: colors.primaryDark,
      borderRadius: 12,
      padding: 10,
      marginBottom: 7,
      borderWidth: 1,
      borderColor: colors.blue,
      shadowColor: colors.black,

    },
  
    // Section Details Row
    sectionDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
  
    // Section Text Details
    sectionTextDetails: {
      flex: 1,
    },
    sectionLabel: {
      color: colors.white,
      fontSize: 15,
      marginBottom: 4,
      fontWeight: '500',
    },
  
    // P/A Buttons Container
    attendanceLegendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
     
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 5,
      paddingHorizontal: 10,
      paddingVertical: 1,
      borderRadius: 8,
      backgroundColor: colors.grayLight,
    },
    legendIndicator: {
      width: 16,
      height: 16,
      borderRadius: 4,
      marginRight: 6,
    },
    legendText: {
      color: colors.black,
      fontWeight: '600',
      fontSize: 14,
    },
  
    // Action Buttons Row
    actionButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      
      borderTopWidth: 1,
      borderTopColor: colors.grayLight,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 5,width:105,
      marginTop:5,
      borderRadius: 8,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.blueLight,
    
      
    },
    actionButtonLast: {
      marginRight: 5
    },
    actionButtonText: {
      marginLeft: 6,
      fontSize: 13,
      color: colors.primaryDark,
      fontWeight: '600',
    },
  
    // Rest of your existing styles...
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
   
  Container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blueLight,
    borderRadius: 8,
    marginBottom: 10,
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
  
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.gray,
  },
  perfectAttendance: {
    
    borderColor: colors.green4,
  },
  red: {
    backgroundColor: colors.redb3,
    borderColor: colors.redb2,
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
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 4,
   color:colors.black
  },
  attendanceButton: {
    width: 27,
    height: 27,
    borderRadius: 7,
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
    borderRadius: 12, // More rounded corners for modern look
    paddingVertical: 10, // Adjusted vertical padding
    paddingHorizontal: 20, // Horizontal padding to control width
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Centers the button horizontally
    minWidth: 180, // Minimum width to prevent too narrow button
     // Vertical margin for spacing
    elevation: 3, // Adds subtle shadow on Android
   
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16, // Slightly smaller font size
    letterSpacing: 2, // Slight letter spacing for better readability
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.blueNavy,
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