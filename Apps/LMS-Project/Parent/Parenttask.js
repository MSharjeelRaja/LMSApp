import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Dimensions
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../ControlsAPI/colors';
import { Navbar } from '../ControlsAPI/Comps';

const { width, height } = Dimensions.get('window');

const ParentTask = ({ route, navigation }) => {
  const { userData } = route.params;
  const { taskData } = userData;
  console.log(userData,'kjdkld')
  // Move filter state management inside this component
  const [taskFilter, setTaskFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filterTasks = () => {
    if (!taskData || taskData.length === 0) return [];

    // Show all courses, even those without tasks
    return taskData.map(course => {
      // Create a copy of the tasks array to avoid mutating the original
      let filteredTasks = course.Tasks ? [...course.Tasks] : [];

      if (taskFilter === 'high') {
        filteredTasks.sort((a, b) => {
          const aPoints = a.obtained_points || 0;
          const bPoints = b.obtained_points || 0;
          return bPoints - aPoints; // Descending for high marks
        });
      } else if (taskFilter === 'low') {
        filteredTasks.sort((a, b) => {
          const aPoints = a.obtained_points || 0;
          const bPoints = b.obtained_points || 0;
          return aPoints - bPoints; // Ascending for low marks
        });
      }

      return {
        ...course,
        Tasks: filteredTasks
      };
    });
  };

  const openConsideredTasksModal = (course) => {
    if (course?.Considered && Object.keys(course.Considered).length > 0) {
      setSelectedCourse(course);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCourse(null);
  };

  // Get filtered courses based on current filter
  const filteredCourses = filterTasks();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Navbar
        title="Student Tasks"
        userName={userData?.parentData?.name}
        des="Parent"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Filter Buttons */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter Tasks:</Text>
          <View style={styles.filterButtons}>
            {['all', 'high', 'low'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton, 
                  taskFilter === type && styles.activeFilter
                ]}
                onPress={() => {
                  console.log(`Setting filter to: ${type}`); // Debug log
                  setTaskFilter(type);
                }}
              >
                <Text style={[
                  styles.filterButtonText,
                  taskFilter === type && styles.activeFilterText
                ]}>
                  {type === 'all' ? 'All' : type === 'high' ? 'High Marks' : 'Low Marks'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Debug output - can be removed after testing */}
        <Text style={styles.debugText}>Current Filter: {taskFilter}</Text>
        <Text style={styles.debugText}>Courses Count: {filteredCourses.length}</Text>

        {/* Tasks Listing */}
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course, index) => (
            <View key={index} style={styles.taskCourseCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="class" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>
                  {course.course_name} ({course.section})
                  {course.IsLab && <Text style={styles.labBadge}> (Lab)</Text>}
                </Text>
                {course.Considered && Object.keys(course.Considered).length > 0 && (
                  <TouchableOpacity
                    style={styles.viewConsideredButton}
                    onPress={() => openConsideredTasksModal(course)}
                  >
                    <Text style={styles.viewConsideredText}>View Considered</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Regular Tasks */}
              {course.Tasks && course.Tasks.length > 0 ? (
                <View>
                  <Text style={styles.sectionTitle}>Tasks:</Text>
                  {course.Tasks.map((task, i) => (
                    <View key={i} style={styles.taskItem}>
                      <Text style={styles.taskTitle}>{task.title || 'Untitled Task'}</Text>
                      <View style={styles.taskDetails}>
                        <Text style={styles.taskType}>Type: {task.type}</Text>
                        <Text style={styles.taskDue}>
                          Due: {task.due_date ? new Date(task.due_date).toLocaleString() : 'N/A'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.taskPoints,
                        {
                          color: task.obtained_points >= task.points * 0.8
                            ? colors.success
                            : task.obtained_points >= task.points * 0.5
                            ? colors.warning
                            : colors.red1,
                        },
                      ]}>
                        Marks: {task.obtained_points || 0} / {task.points}
                      </Text>
                      {task.created_by && (
                        <Text style={styles.taskCreator}>
                          Created by: {task.created_by}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noTasksContainer}>
                  <MaterialIcons name="info-outline" size={24} color={colors.gray} />
                  <Text style={styles.noTasksText}>
                    No task data available for this course
                  </Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment" size={48} color={colors.gray} />
            <Text style={styles.emptyText}>No course data available</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal for Considered Tasks */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Considered Tasks - {selectedCourse?.course_name || ''}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closeModal}
                hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
              >
                <MaterialIcons name="close" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {selectedCourse && (
                <>
                  {Object.keys(selectedCourse.Considered).length === 0 ? (
                    <View style={styles.noDataContainer}>
                      <MaterialIcons 
                        name="info-outline" 
                        size={24} 
                        color={colors.gray} 
                      />
                      <Text style={styles.noDataText}>
                        No considered tasks available
                      </Text>
                    </View>
                  ) : (
                    Object.entries(selectedCourse.Considered).map(([taskType, taskGroup]) => {
                      if (!taskGroup || !taskGroup.Teacher || taskGroup.Teacher.length === 0) {
                        return null;
                      }

                      return (
                        <View key={taskType} style={styles.consideredSection}>
                          <Text style={styles.consideredSectionTitle}>
                            {taskType} Tasks
                          </Text>
                          
                          {taskGroup.Teacher.map((task, taskIndex) => (
                            <View key={taskIndex} style={styles.consideredTaskItem}>
                              <Text style={styles.consideredTaskTitle}>
                                {task.title || 'Untitled Task'}
                              </Text>
                              <View style={styles.consideredTaskRow}>
                                <Text style={styles.consideredTaskLabel}>Type:</Text>
                                <Text style={styles.consideredTaskValue}>{task.type || taskType}</Text>
                              </View>
                              <View style={styles.consideredTaskRow}>
                                <Text style={styles.consideredTaskLabel}>Due:</Text>
                                <Text style={styles.consideredTaskValue}>
                                  {task.due_date ? new Date(task.due_date).toLocaleString() : 'N/A'}
                                </Text>
                              </View>
                              <View style={styles.consideredTaskRow}>
                                <Text style={styles.consideredTaskLabel}>Marks:</Text>
                                <Text style={[
                                  styles.consideredTaskValue,
                                  styles.consideredTaskMarks,
                                  {
                                    color: (task.obtained_points || 0) >= (task.points || 1) * 0.8
                                      ? colors.success
                                      : (task.obtained_points || 0) >= (task.points || 1) * 0.5
                                      ? colors.warning
                                      : colors.red1
                                  }
                                ]}>
                                  {task.obtained_points || '0'} / {task.points}
                                </Text>
                              </View>
                              {task.created_by && (
                                <View style={styles.consideredTaskRow}>
                                  <Text style={styles.consideredTaskLabel}>Created by:</Text>
                                  <Text style={styles.consideredTaskValue}>{task.created_by}</Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      );
                    })
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  filterContainer: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  taskCourseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
    letterSpacing: 0.2,
  },
  labBadge: {
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  viewConsideredButton: {
    backgroundColor: '#dbeafe',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  viewConsideredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 4,
  },
  taskItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskDue: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskCreator: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
  },
  noTasksContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  noTasksText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: width * 0.92,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  consideredSection: {
    marginBottom: 20,
    paddingTop: 8,
  },
  consideredSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  consideredTaskItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  consideredTaskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  consideredTaskRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  consideredTaskLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 70,
    fontWeight: '600',
  },
  consideredTaskValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  consideredTaskMarks: {
    fontWeight: '700',
    fontSize: 13,
  },
  debugText: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
    fontStyle: 'italic',
  },
});

export default ParentTask;