import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  StatusBar, 
  Linking, 
  Modal,
  FlatList,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '../ControlsAPI/Comps';
import { Navbar } from '../ControlsAPI/Comps';
import Icon from "react-native-vector-icons/MaterialIcons";
import CheckBox from '@react-native-community/checkbox';

const Createtask = ({ navigation, route }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [datePicker, setDatePicker] = useState({ visible: false, type: '', mode: 'date' });
  const [assignmentState, setAssignmentState] = useState({
    points: '',
    startDate: new Date(),
    dueDate: new Date(),
    selectedSections: [],
  });

  const userData = route.params?.userData || {};

  // Transform API data into structured format
  const structuredCourses = useMemo(() => {
    return courses.map(course => ({
      ...course,
      weeks: Object.entries(course.task_details).map(([weekNumber, tasks]) => ({
        weekNumber,
        tasks,
        expanded: expandedWeeks[weekNumber] || false
      }))
    }));
  }, [courses, expandedWeeks]);

  useEffect(() => {
    fetchUnassignedTasks();
  }, []);

  const fetchUnassignedTasks = async () => {
    try {
      console.log('Fetching unassigned tasks...');
      const response = await fetch(`${API_URL}/api/JuniorLec/task/un-assigned?teacher_id=${userData.id}`);
      const data = await response.json();
      console.log('response:', response);
      console.log('Unassigned tasks:', data);
      console.log('Status:', data.status);
      if (data.status) {
        setCourses(Object.values(data.data).flat());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeek = (weekNumber) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekNumber]: !prev[weekNumber]
    }));
  };

  const handleDateTimeChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setDatePicker(p => ({ ...p, visible: false }));
      return;
    }
  
    const newDate = selectedDate || new Date();
    const dateKey = datePicker.type;
  
    // Create a NEW Date object instead of modifying the existing one
    let updatedDate = new Date(newDate);
  
    // For time mode, preserve the existing date parts and update time
    if (datePicker.mode === 'time') {
      const prevDate = new Date(assignmentState[dateKey]);
      updatedDate = new Date(
        prevDate.getFullYear(),
        prevDate.getMonth(),
        prevDate.getDate(),
        newDate.getHours(),
        newDate.getMinutes()
      );
    }
  
    setAssignmentState(prev => ({
      ...prev,
      [dateKey]: updatedDate
    }));
  
    // Switch to time picker after date selection
    if (datePicker.mode === 'date') {
      setDatePicker({ visible: true, type: dateKey, mode: 'time' });
    } else {
      setDatePicker({ visible: false, type: '', mode: 'date' });
    }
  };
  const formatDateTime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  };

  const handleAssignTask = async () => {
    if (!assignmentState.points || assignmentState.selectedSections.length === 0) {
      Alert.alert('Error', 'Please fill all fields and select at least one section');
      return;
    }

    setLoading(true);
    try {
     
      console.log('Request Body:', {  
        teacher_offered_course_id: assignmentState.selectedSections[0].teacher_offered_course_id,
        coursecontent_id: selectedTask.id,
        points: parseInt(assignmentState.points),
        start_date: formatDateTime(assignmentState.startDate),
        due_date: formatDateTime(assignmentState.dueDate),
      });
      const requests = assignmentState.selectedSections.map(section => 
        fetch(`${API_URL}/api/Juniorlec/create/task`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacher_offered_course_id: section.teacher_offered_course_id,
            coursecontent_id: selectedTask.id,
            points: parseInt(assignmentState.points),
            start_date: formatDateTime(assignmentState.startDate),
            due_date: formatDateTime(assignmentState.dueDate),
          }),
        })
      );
console.log(requests)
      await Promise.all(requests);
      Alert.alert('Success', 'Task assigned successfully');
      setSelectedTask(null);
      fetchUnassignedTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const renderWeekTasks = (courseId, week) => (
    <View key={`${courseId}-${week.weekNumber}`}>
      <TouchableOpacity 
        style={styles.weekHeader}
        onPress={() => toggleWeek(week.weekNumber)}
      >
        <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
        <Icon 
          name={week.expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
          size={24} 
          color="#000" 
        />
      </TouchableOpacity>
      
      {week.expanded && week.tasks.map(task => (
        <View key={task.id} style={styles.taskCard}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskType}>{task.type}</Text>
          
          <TouchableOpacity 
            style={styles.assignButton}
            onPress={() => {
              setSelectedTask(task);
              setAssignmentState({
                points: '',
                startDate: new Date(),
                dueDate: new Date(Date.now() + 604800000),
                selectedSections: [],
              });
            }}
          >
            <Text style={styles.assignButtonText}>Assign Task</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <Navbar
        title="LMS"
        userName={userData.name}
        des={'Junior lecturer'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
        textColor="#000"
        bgColor="#fff"
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {structuredCourses.map(course => (
          <View key={course.offered_course_id} style={styles.courseContainer}>
            <Text style={styles.courseTitle}>{course.course_name}</Text>
            {course.weeks.map(week => renderWeekTasks(course.offered_course_id, week))}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedTask}
        animationType="slide"
        onRequestClose={() => setSelectedTask(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
            <TouchableOpacity onPress={() => setSelectedTask(null)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Points"
              keyboardType="numeric"
              value={assignmentState.points}
              onChangeText={text => setAssignmentState(p => ({ ...p, points: text }))}
            />

            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePicker({ visible: true, type: 'startDate', mode: 'date' })}
              >
                <Icon name="calendar-today" size={20} color="#000" />
                <Text style={styles.dateText}>
                  Start Date: {assignmentState.startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePicker({ visible: true, type: 'startDate', mode: 'time' })}
              >
                <Icon name="access-time" size={20} color="#000" />
                <Text style={styles.dateText}>
                  Start Time: {assignmentState.startDate.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePicker({ visible: true, type: 'dueDate', mode: 'date' })}
              >
                <Icon name="event" size={20} color="#000" />
                <Text style={styles.dateText}>
                  Due Date: {assignmentState.dueDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePicker({ visible: true, type: 'dueDate', mode: 'time' })}
              >
                <Icon name="access-time" size={20} color="#000" />
                <Text style={styles.dateText}>
                  Due Time: {assignmentState.dueDate.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Available Sections:</Text>
            {selectedTask?.un_assigned_to?.map(section => (
              <View key={section.teacher_offered_course_id} style={styles.checkboxContainer}>
                <CheckBox
                  value={assignmentState.selectedSections.some(s => 
                    s.teacher_offered_course_id === section.teacher_offered_course_id
                  )}
                  onValueChange={() => {
                    setAssignmentState(prev => ({
                      ...prev,
                      selectedSections: prev.selectedSections.some(s => 
                        s.teacher_offered_course_id === section.teacher_offered_course_id
                      ) 
                        ? prev.selectedSections.filter(s => 
                            s.teacher_offered_course_id !== section.teacher_offered_course_id
                          )
                        : [...prev.selectedSections, section]
                    }));
                  }}
                  tintColors={{ true: '#000', false: '#666' }}
                />
                <Text style={styles.sectionText}>{section.section_name}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalButton}
            onPress={handleAssignTask}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.modalButtonText}>Confirm Assignment</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

     
{datePicker.visible && (
  <DateTimePicker
    key={`${datePicker.type}-${datePicker.mode}`} // Force remount on mode/type change
    value={assignmentState[datePicker.type]}
    mode={datePicker.mode}
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={handleDateTimeChange}
    minimumDate={new Date()}
  />
)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
  },
  courseContainer: {
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  taskCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  taskType: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  assignButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalContent: {
    padding: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#000',
  },
  dateContainer: {
    gap: 10,
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
  },
  dateText: {
    marginLeft: 8,
    color: '#000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  sectionText: {
    marginLeft: 8,
    color: '#000',
  },
  modalButton: {
    backgroundColor: '#000',
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#000',
    textAlign: 'center',
  },
});

export default Createtask;