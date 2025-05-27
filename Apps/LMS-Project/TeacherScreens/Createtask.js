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

// Color theme constants
const COLORS = {
  primary: '#1E88E5',       // Primary blue
  primaryDark: '#1565C0',   // Darker blue for buttons
  secondary: '#64B5F6',     // Light blue for backgrounds
  accent: '#2979FF',        // Accent blue for highlights
  white: '#FFFFFF',
  lightGray: '#F5F7FA',     // Light background
  midGray: '#E3E8F0',       // For cards and separators
  darkGray: '#546E7A',      // For secondary text
  black: '#263238',         // For primary text
}

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
      const response = await fetch(`${API_URL}/api/Teachers/task/un-assigned?teacher_id=${userData.id}`);
      const data = await response.json();
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
      Alert.alert('Missing Information', 'Please fill all fields and select at least one section');
      return;
    }

    setLoading(true);
    try {
      const requests = assignmentState.selectedSections.map(section => 
        fetch(`${API_URL}/api/Teachers/create/task`, {
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
    <View key={`${courseId}-${week.weekNumber}`} style={styles.weekContainer}>
      <TouchableOpacity 
        style={[styles.weekHeader, week.expanded && styles.weekHeaderExpanded]}
        onPress={() => toggleWeek(week.weekNumber)}
        activeOpacity={0.7}
      >
        <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
        <View style={styles.iconContainer}>
          <Icon 
            name={week.expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
      </TouchableOpacity>
      
      {week.expanded && (
        <View style={styles.tasksContainer}>
          {week.tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View style={styles.taskTypeBadge}>
                  <Text style={styles.taskTypeText}>{task.type}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.assignButton}
                onPress={() => {
                  setSelectedTask(task);
                  setAssignmentState({
                    points: '',
                    startDate: new Date(),
                    dueDate: new Date(Date.now() + 604800000), // One week from now
                    selectedSections: [],
                  });
                }}
                activeOpacity={0.8}
              >
                <Icon name="assignment" size={18} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.assignButtonText}>Assign Task</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <Navbar
        title="Assign Tasks"
        userName={userData.name}
        des={'Teacher'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
        textColor={COLORS.white}
        bgColor={COLORS.primary}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.pageTitle}>Unassigned Tasks</Text>
        <Text style={styles.pageSubtitle}>Assign tasks to your class sections</Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="assignment-turned-in" size={64} color={COLORS.secondary} />
          <Text style={styles.emptyText}>No unassigned tasks available</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {structuredCourses.map(course => (
            <View key={course.offered_course_id} style={styles.courseContainer}>
              <View style={styles.courseTitleContainer}>
                <Icon name="school" size={24} color={COLORS.primary} />
                <Text style={styles.courseTitle}>{course.course_name}</Text>
              </View>
              {course.weeks.map(week => renderWeekTasks(course.offered_course_id, week))}
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={!!selectedTask}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTask(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
              <TouchableOpacity 
                onPress={() => setSelectedTask(null)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Icon name="close" size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Points</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter maximum points"
                  placeholderTextColor={COLORS.darkGray}
                  keyboardType="numeric"
                  value={assignmentState.points}
                  onChangeText={text => setAssignmentState(p => ({ ...p, points: text }))}
                />
              </View>

              <Text style={styles.sectionTitle}>Assignment Timeline</Text>
              <View style={styles.dateContainer}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setDatePicker({ visible: true, type: 'startDate', mode: 'date' })}
                >
                  <Icon name="calendar-today" size={20} color={COLORS.primary} />
                  <Text style={styles.dateText}>
                    Start Date: {assignmentState.startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setDatePicker({ visible: true, type: 'startDate', mode: 'time' })}
                >
                  <Icon name="access-time" size={20} color={COLORS.primary} />
                  <Text style={styles.dateText}>
                    Start Time: {assignmentState.startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setDatePicker({ visible: true, type: 'dueDate', mode: 'date' })}
                >
                  <Icon name="event" size={20} color={COLORS.primary} />
                  <Text style={styles.dateText}>
                    Due Date: {assignmentState.dueDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setDatePicker({ visible: true, type: 'dueDate', mode: 'time' })}
                >
                  <Icon name="access-time" size={20} color={COLORS.primary} />
                  <Text style={styles.dateText}>
                    Due Time: {assignmentState.dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Available Sections</Text>
              {selectedTask?.un_assigned_to?.length === 0 ? (
                <Text style={styles.noSectionText}>No sections available for assignment</Text>
              ) : (
                selectedTask?.un_assigned_to?.map(section => (
                  <TouchableOpacity
                    key={section.teacher_offered_course_id} 
                    style={styles.checkboxContainer}
                    onPress={() => {
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
                  >
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
                      tintColors={{ true: COLORS.primary, false: COLORS.darkGray }}
                    />
                    <Text style={styles.sectionText}>{section.section_name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setSelectedTask(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={handleAssignTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Icon name="check" size={18} color={COLORS.white} style={styles.buttonIcon} />
                    <Text style={styles.confirmButtonText}>Assign Task</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
          // Custom theming for Android
          themeVariant="light"
          textColor={COLORS.black}
          accentColor={COLORS.primary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.primary,
    fontSize: 16,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.midGray,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  scrollContainer: {
    padding: 16,
  },
  courseContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 8,
  },
  weekContainer: {
    marginBottom: 12,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 14,
    borderRadius: 8,
  },
  weekHeaderExpanded: {
    backgroundColor: COLORS.secondary + '30', // 30% opacity
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksContainer: {
    backgroundColor: COLORS.lightGray,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    flex: 1,
  },
  taskTypeBadge: {
    backgroundColor: COLORS.secondary + '30', // 30% opacity
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  taskTypeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.midGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.midGray,
    borderRadius: 8,
    padding: 12,
    color: COLORS.black,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.midGray,
  },
  dateContainer: {
    gap: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.midGray,
  },
  dateText: {
    marginLeft: 10,
    color: COLORS.black,
    fontSize: 15,
  },
  noSectionText: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8, 
    marginVertical: 6,
  },
  sectionText: {
    marginLeft: 10,
    color: COLORS.black,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.midGray,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.secondary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Createtask;