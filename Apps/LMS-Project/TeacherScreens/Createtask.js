// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
// import { SelectList } from 'react-native-dropdown-select-list';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { API_URL, COLORS } from '../ControlsAPI/Comps';
// import { Navbar } from '../ControlsAPI/Comps';
// import colors from '../ControlsAPI/colors';

// const CreateTaskScreen = ({ navigation, route }) => {
//   const [loading, setLoading] = useState(true);
//   const [taskData, setTaskData] = useState([]);
//   const [courseOptions, setCourseOptions] = useState([]);
//   const [sectionOptions, setSectionOptions] = useState([]);
//   const [selectedCourse, setSelectedCourse] = useState(null);
//   const [selectedSection, setSelectedSection] = useState(null);
//   const [taskTitle, setTaskTitle] = useState('SP24-LABTASK-02');
//   const [taskType, setTaskType] = useState('Assignment');
//   const [totalPoints, setTotalPoints] = useState('');
  
//   // Date picker states
//   const [startDate, setStartDate] = useState(new Date());
//   const [startTime, setStartTime] = useState(new Date());
//   const [dueDate, setDueDate] = useState(new Date());
//   const [dueTime, setDueTime] = useState(new Date());
//   const [showStartDatePicker, setShowStartDatePicker] = useState(false);
//   const [showStartTimePicker, setShowStartTimePicker] = useState(false);
//   const [showDueDatePicker, setShowDueDatePicker] = useState(false);
//   const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  
//   const userData = route.params?.userData?.TeacherInfo || {};

//   useEffect(() => {
//     fetch(`${API_URL}/api/Teachers/All-courses/${userData.id}`)
//       .then(res => res.json())
//       .then(data => {
//         setTaskData(data);

//         // Populate course dropdown
//         const uniqueCourses = [];
//         const courseMap = {};
//         data.forEach(item => {
//           if (!courseMap[item.offered_course_id]) {
//             courseMap[item.offered_course_id] = true;
//             uniqueCourses.push({
//               key: item.offered_course_id.toString(),
//               value: `${item.course_name} (${item.course_code})`,
//               course_id: item.course_id,
//               offered_course_id: item.offered_course_id,
//               course_name: item.course_name
//             });
//           }
//         });

//         setCourseOptions(uniqueCourses);
//         if (uniqueCourses.length > 0) {
//           setSelectedCourse(uniqueCourses[0].key);
//           updateSectionOptions(uniqueCourses[0].key, data);
//         }
//       })
//       .catch(error => {
//         console.error("Error fetching courses:", error);
//         Alert.alert("Error", "Failed to load courses.");
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const updateSectionOptions = (offeredCourseId, coursesData) => {
//     const filteredSections = coursesData.filter(item => item.offered_course_id.toString() === offeredCourseId);
    
//     const sections = filteredSections.map(item => ({
//       key: item.section_id.toString(),
//       value: item.Section,
//       teacher_offered_course_id: item.teacher_offered_course_id,
//       section_id: item.section_id
//     }));
    
//     setSectionOptions(sections);
//     if (sections.length > 0) setSelectedSection(sections[0].key);
//   };

//   const handleCourseChange = (selectedKey) => {
//     setSelectedCourse(selectedKey);
//     updateSectionOptions(selectedKey, taskData);
//   };
  
//   const formatDateTime = (date, time) => {
//     const year = date.getFullYear();
//     const month = (`0${date.getMonth() + 1}`).slice(-2);
//     const day = (`0${date.getDate()}`).slice(-2);
//     const hours = (`0${time.getHours()}`).slice(-2);
//     const minutes = (`0${time.getMinutes()}`).slice(-2);
//     const seconds = "00";
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   };

//   // Format for Display
//   const formatDate = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
//   const formatTime = (time) => `${time.getHours()}:${time.getMinutes()}`;

//   // Create Task API Call
//   const createTask = async () => {
//     if (!selectedCourse || !selectedSection || !totalPoints) {
//       Alert.alert('Error', 'Please fill in all required fields');
//       return;
//     }

//     setLoading(true);

//     const startDateTimeString = formatDateTime(startDate, startTime);
//     const dueDateTimeString = formatDateTime(dueDate, dueTime);
    
//     // Find the selected course and section details
//     const selectedCourseDetails = courseOptions.find(course => course.key === selectedCourse);
//     const selectedSectionDetails = sectionOptions.find(section => section.key === selectedSection);
    
//     const requestData = {
//       type: taskType,
//       coursecontent_id: 73,
//       points: parseInt(totalPoints),
//       start_date: startDateTimeString,
//       due_date: dueDateTimeString,
//       sectioninfo:'BAI-'+ selectedSectionDetails.value,
//       course_name: selectedCourseDetails.course_name,
    
      
//     };
    
//     console.log("Sending Data:", requestData);
    
//     try {
//       const response = await fetch(`${API_URL}/api/Teachers/store-task`, {
//         method: 'POST',
//         headers: {
//           "Content-Type": "application/json",
//           "Accept": "application/json"
//         },
//         body: JSON.stringify(requestData),
//       });
      
//       const result = await response.json();
// console.log("API Response:", result);

// if (result.tasks && result.tasks.length > 0) {
//   Alert.alert("Response Status:", result.tasks[0].message );
// } else {
//   console.log("No tasks found in response.");
// }

      
// if (result.status === 'success' && result.tasks[0].status !== 'error') {
//   Alert.alert('Success', result.message);
// } else {
//   Alert.alert('Error', result.tasks[0].message  || 'Failed to create task');
// }

//     } catch (error) {
//       console.error("API Error:", error);
//       Alert.alert('Error', 'Network error occurred');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
//       <Navbar
//         title="LMS"
//         userName={userData.name}
//         des={route.params?.userData?.Type}
//         onLogout={() => navigation.replace('Login')}
//       />
      
//       <ScrollView style={styles.scrollView}>
//         <Text style={styles.pageTitle}>Assign Task To Section</Text>
        
//         {loading ? (
//           <ActivityIndicator size="large" color={colors.primary} />
//         ) : (
//           <>
//           <Text style={styles.labelText}>Course</Text>
//           <View style={styles.pickerContainer}>
//             <SelectList
//               boxStyles={{ borderColor: colors.white }}
//               inputStyles={{ color: 'black' }}
//               dropdownTextStyles={{ color: 'black' }}
//               setSelected={handleCourseChange}
//               data={courseOptions}
//               save="key"
//               placeholder="Select Course"
//             />
//           </View>
        
//           <Text style={styles.labelText}>Section</Text>
//           <View style={styles.pickerContainer}>
//             <SelectList
//               boxStyles={{ borderColor: colors.white }}
//               inputStyles={{ color: 'black' }}
//               dropdownTextStyles={{ color: 'black' }}
//               setSelected={setSelectedSection}
//               data={sectionOptions}
//               save="key"
//               placeholder="Select Section"
//             />
//           </View>
//         </>
        
//         )}
        


//         {/* Task Type Selection */}
//         <Text style={styles.labelText}>Task Type</Text>
//         <View style={styles.pickerContainer}>
//           <SelectList  boxStyles={{ borderColor: colors.white }} 
//   inputStyles={{ color: 'black' }} 
//   dropdownTextStyles={{ color: 'black' }}
//             setSelected={setTaskType}
//             data={[
//               { key: 'Assignment', value: 'Assignment' },
//               { key: 'Quiz', value: 'Quiz' },
//               { key: 'Lab Task', value: 'Lab Task' },
//             ]}
//             save="value"
//             placeholder="Select Task Type"
//             defaultOption={{ key: taskType, value: taskType }}
//           />
//         </View>

//         {/* Start Date & Time */}
//         <Text style={styles.labelText}>Start Time & Date</Text>
//         <View style={styles.rowContainer}>
//           <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowStartTimePicker(true)}>
//             <Text style={styles.dateTimeText}>🕒 {formatTime(startTime)}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowStartDatePicker(true)}>
//             <Text style={styles.dateTimeText}>📅 {formatDate(startDate)}</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Due Date & Time */}
//         <Text style={styles.labelText}>Due Time & Date</Text>
//         <View style={styles.rowContainer}>
//           <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDueTimePicker(true)}>
//             <Text style={styles.dateTimeText}>🕒 {formatTime(dueTime)}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDueDatePicker(true)}>
//             <Text style={styles.dateTimeText}>📅 {formatDate(dueDate)}</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Points */}
//         <Text style={styles.labelText}>Total Points</Text>
//         <TextInput
//           style={styles.input}
//           value={totalPoints}
//           onChangeText={setTotalPoints}
//           keyboardType="numeric"
//           placeholder="Enter total points"
//           placeholderTextColor={'black'}
//         />

//         {/* Create Button */}
//         <TouchableOpacity style={styles.createButton} onPress={createTask} disabled={loading}>
//           {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Create</Text>}
//         </TouchableOpacity>

//         {/* Date & Time Pickers */}
//         {showStartDatePicker && (
//           <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, date) => {
//             setShowStartDatePicker(false);
//             if (date) setStartDate(date);
//           }} />
//         )}
//         {showStartTimePicker && (
//           <DateTimePicker value={startTime} mode="time" display="default" onChange={(e, date) => {
//             setShowStartTimePicker(false);
//             if (date) setStartTime(date);
//           }} />
//         )}
//         {showDueDatePicker && (
//           <DateTimePicker value={dueDate} mode="date" display="default" onChange={(e, date) => {
//             setShowDueDatePicker(false);
//             if (date) setDueDate(date);
//           }} />
//         )}
//         {showDueTimePicker && (
//           <DateTimePicker value={dueTime} mode="time" display="default" onChange={(e, date) => {
//             setShowDueTimePicker(false);
//             if (date) setDueTime(date);
//           }} />
//         )}
//       </ScrollView>
//     </View>
//   );
// };
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f7fa',
//   },
//   scrollView: {
//     flex: 1,
//     padding: 16,
//   },
//   pageTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#2d3748',
//     textAlign: 'center',
//     marginBottom: 20,
//     marginTop: 8,
//   },
//   labelText: {
//     color: '#2d3748',
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 4,
//     marginTop: 12,
//   },
//   input: {
//     backgroundColor: '#ffffff',
//     padding: 10,
//     borderRadius: 6,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     fontSize: 14,
//     color: '#2d3748',
//   },
//   pickerContainer: {
//     backgroundColor: '#ffffff',
//     borderRadius: 6,
//     marginBottom: 12,
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   rowContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 6,
//   },
//   dateTimeButton: {
//     flexDirection: 'row',
//     backgroundColor: '#ffffff',
//     width: '48%',
//     padding: 10,
//     borderRadius: 6,
//     marginBottom: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 1,
//     elevation: 1,
//   },
//   dateTimeText: {
//     fontSize: 14,
//     color: '#000000',
//     fontWeight: '500',
//   },
//   createButton: {
//     backgroundColor: '#4299e1',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 16,
//     marginBottom: 30,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   createButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   sectionTag: {
//     flexDirection: 'row',
//     backgroundColor: '#ebf8ff',
//     borderRadius: 16,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     margin: 4,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#bee3f8',
//   },
//   sectionTagText: {
//     marginRight: 4,
//     color: 'black',
//     fontWeight: '500',
//     fontSize: 14,
//   },
//   removeButton: {
//     color: '#2b6cb0',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   selectedSectionsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 12,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 16,
//   },
//   header: {
//     backgroundColor: '#4299e1',
//     padding: 16,
//     paddingTop: StatusBar.currentHeight || 36,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   welcomeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   welcomeText: {
//     color: '#e6f2ff',
//     fontSize: 14,
//   },
//   nameText: {
//     color: 'black',
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginVertical: 2,
//   },
//   roleText: {
//     color: '#e6f2ff',
//     fontSize: 14,
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     borderWidth: 2,
//     borderColor: 'white',
//   },
// });

// export default CreateTaskScreen;
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import colors from '../ControlsAPI/colors'

const Createtask = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Createtask</Text>
    </View>
  )
}

export default Createtask

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blueNavy,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  text: {
    color: colors.white,
    fontSize: 18, // Optional: Adjust text size
    fontWeight: 'bold', // Optional: Make text bold
  }
})
