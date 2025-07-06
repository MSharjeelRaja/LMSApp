import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Linking,
  FlatList,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import colors from '../ControlsAPI/colors';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAlert } from '../ControlsAPI/alert';
import DateTimePicker from '@react-native-community/datetimepicker';

const TaskGetScreen = ({ navigation, route }) => {
  const Tid = global.Tid;
  const userData = route.params?.userData || {};
  const alertContext = useAlert();
  // Add these to your existing state declarations
const [showEditModal, setShowEditModal] = useState(false);

const [showDatePicker, setShowDatePicker] = useState(false);
const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
const [newDueDate, setNewDueDate] = useState(new Date());
const [datePickerMode, setDatePickerMode] = useState('date');


  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [tasks, setTasks] = useState({
    completed: [],
    upcoming: [],
    ongoing: [],
    unmarked: []
  });
  
  // Grader assignment state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showGraderModal, setShowGraderModal] = useState(false);
  const [graders, setGraders] = useState([]);
  const [graderId, setGraderId] = useState(null);
  const [loadingGraders, setLoadingGraders] = useState(false);

  // MCQ Modal state
  const [showMCQModal, setShowMCQModal] = useState(false);
  const [currentMCQs, setCurrentMCQs] = useState([]);

  // Performance stats modal
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/Teachers/task/get?teacher_id=${Tid}`);
      const data = await response.json();
      console.log("Fetched Tasks:", data.Tasks);
      if (data.status === "success") {
        setTasks({
          completed: data.Tasks.completed_tasks || [],
          upcoming: data.Tasks.upcoming_tasks || [],
          ongoing: data.Tasks.ongoing_tasks || [],
          unmarked: data.Tasks.unmarked_tasks || []
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      Alert.alert("Error", "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);
const handleDeleteTask = async (taskId) => {
  Alert.alert(
    "Confirm Delete",
    "Are you sure you want to delete this task?",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      { 
        text: "Delete", 
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/api/Teachers/remover/task`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ task_id: taskId })
            });

            const data = await response.json();

            if (data.success) {
              alertContext.showAlert('success', "Task deleted successfully!");

              fetchTasks();
            } else {
              throw new Error(data.message || "Failed to delete task");
            }
          } catch (error) {
            console.error("Error deleting task:", error);
            alertContext.showAlert('error', error.message);
          }
        }
      }
    ]
  );
};
  const fetchGraders = async () => {
    setLoadingGraders(true);
    try {
      const response = await fetch(`${API_URL}/api/Teachers/teacher-graders?teacher_id=${Tid}`);
      const data = await response.json();
      if (data.status === "success") {
        setGraders(data.active_graders || []);
      } else {
        alertContext.showAlert('error', data.message || "Failed to fetch graders");
      }
    } catch (error) {
      console.error("Error fetching graders:", error);
      alertContext.showAlert('error', "Network error fetching graders");
    } finally {
      setLoadingGraders(false);
    }
  };
const handleDateTimeChange = (event, selectedDate) => {
  setShowDatePicker(false);
  
  if (event.type === 'dismissed') {
    return;
  }

  const currentDate = selectedDate || newDueDate;
  setNewDueDate(currentDate);

  // If we were in date mode, switch to time mode
  if (datePickerMode === 'date') {
    setDatePickerMode('time');
    setShowDatePicker(true);
  } else {
    // After time is selected, we're done
    setDatePickerMode('date');
  }
};const formatDateTime = (date) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};
  const handleAssignGrader = async (taskId) => {
    setSelectedTaskId(taskId);
    setGraderId(null);
    await fetchGraders();
    setShowGraderModal(true);
  };

  const confirmGraderAssignment = async () => {
    if (!graderId) {
      alertContext.showAlert('warning', "Please select a grader first");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/Teachers/tasks/assign-grader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: selectedTaskId,
          grader_id: graderId
        })
      });

      const data = await response.json();

      if (data.success) {
        alertContext.showAlert('success', "Grader assigned successfully!");
        fetchTasks();
      } else {
        throw new Error(data.message || "Failed to assign grader");
      }
    } catch (error) {
      console.error("Error assigning grader:", error);
      alertContext.showAlert('error', error.message);
    } finally {
      setShowGraderModal(false);
    }
  };

  const handleViewFile = (fileUrl) => {
    if (!fileUrl) {
      Alert.alert("Error", "No file available");
      return;
    }
    Linking.openURL(fileUrl).catch(err => {
      Alert.alert("Error", "Failed to open file");
      console.error("Failed to open URL:", err);
    });
  };

  const handleViewSubmissions = (taskId,taskname,points) => {
    navigation.navigate('ViewSubmissions', { taskId,taskname,points, userData });
  };

  const handleViewMCQs = (mcqs) => {
    if (!mcqs || mcqs.length === 0) {
      Alert.alert("Info", "No MCQs available for this task");
      return;
    }
    setCurrentMCQs(mcqs);
    setShowMCQModal(true);
  };

  const handleViewPerformance = (markingInfo) => {
    if (!markingInfo) {
      Alert.alert("Info", "No performance data available for this task");
      return;
    }
    setPerformanceData(markingInfo);
    setShowPerformanceModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderGraderInfo = (task) => {
    if (task['Is Allocated To Grader'] === 'Yes') {
      // Extract grader name and ID from the info string
      const graderInfo = task['Grader Info For this Task'];
      const match = graderInfo.match(/Grader (.+?)\/\((.+?)\)/);
      
      return (
        <View style={styles.detailRow}>
          <Icon name="person" size={16} color="#000000" />
          <Text style={styles.taskInfo}>
            {match ? `Grader: ${match[1]} (${match[2]})` : 'Grader assigned'}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.detailRow}>
          <Icon name="person-off" size={16} color="#000000" />
          <Text style={styles.taskInfo}>Grader: Unallocated</Text>
        </View>
      );
    }
  };
const handleEditDueDate = async () => {
  if (!selectedTaskForEdit) {
    alertContext.showAlert('warning', "No task selected");
    return;
  }

  try {
    const formattedDate = formatDateTime(newDueDate);
    
    const response = await fetch(`${API_URL}/api/Teachers/task/update-enddatetime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: selectedTaskForEdit,
        EndDateTime: formattedDate
      })
    });

    // First check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(text || 'Server returned non-JSON response');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update due date");
    }

    alertContext.showAlert('success', "Due date updated successfully!");
    fetchTasks();
    setShowEditModal(false);
    setDatePickerMode('date');
  } catch (error) {
    console.error("Error updating due date:", error);
    
    // Extract meaningful error message
    let errorMessage = error.message;
    if (errorMessage.includes('<html>')) {
      errorMessage = "Server error occurred. Please try again later.";
    } else if (errorMessage.includes('Unexpected token')) {
      errorMessage = "Invalid server response. Please contact support.";
    }

    alertContext.showAlert('error', errorMessage);
  }
};
  const renderPerformanceStats = (task) => {
    if (task.marking_status !== 'Marked' || !task.marking_info) {
      return null;
    }

    return (
      <TouchableOpacity 
        style={styles.performanceButton}
        onPress={() => handleViewPerformance(task.marking_info)}
      >
        <Text style={styles.performanceButtonText}>View Performance Stats</Text>
      </TouchableOpacity>
    );
  };

  const renderTaskButtons = (task) => {
    const commonButtons = [
      task.File && (
        <TouchableOpacity 
          key="view-file"
          style={[styles.button, styles.viewButton]}
          onPress={() => handleViewFile(task.File)}
        >
          <Icon name="visibility" size={16} color="white" />
          <Text style={styles.buttonText}>View File</Text>
        </TouchableOpacity>
      ),
      task.type === 'MCQS' && (
        <TouchableOpacity 
          key="view-mcqs"
          style={[styles.button, styles.mcqsButton]}
          onPress={() => handleViewMCQs(task.MCQS)}
        >
          <Icon name="quiz" size={16} color="white" />
          <Text style={styles.buttonText}>View MCQs</Text>
        </TouchableOpacity>
      )
    ];

    switch (activeTab) {
      case 'upcoming':
        return [
          <TouchableOpacity 
            key="assign-grader"
            style={[styles.button, styles.assignButton]}
            onPress={() => handleAssignGrader(task.task_id)}
          >
            <Icon name="person-add" size={16} color="white" />
            <Text style={styles.buttonText}>Assign Grader</Text>
          </TouchableOpacity>,
            <TouchableOpacity 
          key="delete-task"
          style={[ styles.assignButton,styles.button]}
          onPress={() => handleDeleteTask(task.task_id)}
        >
          <Icon name="delete" size={16} color="white" />
          <Text style={styles.buttonText}>Delete Task</Text>
        </TouchableOpacity>,
          ...commonButtons
        ];
         case 'ongoing':
  return [
    <TouchableOpacity 
      key="edit-due-date"
      style={[styles.button, styles.editButton]}
      onPress={() => {
        setSelectedTaskForEdit(task.task_id);
        setNewDueDate(new Date(task.due_date || new Date()));
        setShowEditModal(true);
      }}
    >
      <Icon name="edit" size={16} color="white" />
      <Text style={styles.buttonText}>Edit Due Date</Text>
    </TouchableOpacity>,
    ...commonButtons
  ];
      case 'completed':
        return [
          <TouchableOpacity 
            key="view-submissions"
            style={[styles.button, styles.viewButton]}
            onPress={() => handleViewSubmissions(task.task_id,task.title,task.points)}
          >
            <Icon name="list-alt" size={16} color="white" />
            <Text style={styles.buttonText}>View Submissions</Text>
          </TouchableOpacity>,
          ...commonButtons
        ];
      
      case 'unmarked':
        return [
          <TouchableOpacity 
            key="assign-grader"
            style={[styles.button, styles.assignButton]}
            onPress={() => handleAssignGrader(task.task_id)}
          >
            <Icon name="person-add" size={16} color="white" />
            <Text style={styles.buttonText}>Assign Grader</Text>
          </TouchableOpacity>,
          <TouchableOpacity 
            key="mark-task"
            style={[styles.button, styles.markButton]}
                      onPress={() => handleViewSubmissions(task.task_id,task.title,task.points)}
          >
            <Icon name="check-circle" size={16} color="white" />
            <Text style={styles.buttonText}>Mark Task</Text>
          </TouchableOpacity>,
          ...commonButtons
        ];
      
      default:
        return commonButtons;
    }
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <View style={styles.taskTypeBadge}>
          <Text style={styles.taskTypeText}>{item.type}</Text>
        </View>
      </View>
      
      <View style={styles.taskDetails}>
        <View style={styles.detailRow}>
          <Icon name="class" size={16} color="#000000" />
          <Text style={styles.taskInfo}>{item.Section}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="book" size={16} color="#000000" />
          <Text style={styles.taskInfo}>{item['Course Name']}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="star" size={16} color="#000000" />
          <Text style={styles.taskInfo}>{item.points} points</Text>
        </View>
        
        {renderGraderInfo(item)}
        
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#000000" />
          <Text style={styles.taskInfo}>Start: {formatDate(item.start_date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color="#000000" />
          <Text style={styles.taskInfo}>Due: {formatDate(item.due_date)}</Text>
        </View>
        
        {renderPerformanceStats(item)}
      </View>
      
      <View style={styles.buttonContainer}>
        {renderTaskButtons(item)}
      </View>
    </View>
  );

  const renderTabContent = () => {
    const currentTasks = tasks[activeTab] || [];
    
    return (
      <FlatList
        data={currentTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.task_id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No {activeTab} tasks</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Navbar
        title="Teacher Tasks"
        userName={userData?.name || ''}
        des={'Teacher Dashboard'}
        onLogout={() => navigation.replace('Login')}
        showBackButton={true}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <>
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['ongoing', 'upcoming', 'completed', 'unmarked'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tasks[tab].length})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.tabContent}>
            {renderTabContent()}
          </View>
        </>
      )}
      
      {/* Grader Assignment Modal */}
      <Modal
        visible={showGraderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGraderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Grader</Text>
            
            {loadingGraders ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : graders.length === 0 ? (
              <Text style={styles.noGradersText}>No active graders available</Text>
            ) : (
              <>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={graderId}
                    onValueChange={(itemValue) => setGraderId(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a grader" value={null} />
                    {graders.map(grader => (
                      <Picker.Item 
                        key={grader.grader_id} 
                        label={`${grader.name} (${grader.RegNo})`} 
                        value={grader.grader_id} 
                      />
                    ))}
                  </Picker>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowGraderModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={confirmGraderAssignment}
                    disabled={!graderId}
                  >
                    <Text style={styles.modalButtonText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* MCQ Modal */}
      <Modal
        visible={showMCQModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMCQModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.mcqModalContent]}>
            <Text style={styles.modalTitle}>MCQ Questions</Text>
            
            <ScrollView style={styles.mcqScrollView}>
              {currentMCQs.map((mcq, index) => (
                <View key={index} style={styles.mcqItem}>
                  <Text style={styles.mcqQuestion}>
                    {mcq['Question NO']}. {mcq.Question} ({mcq.Points} points)
                  </Text>
                  <Text style={styles.mcqOption}>1. {mcq['Option 1']}</Text>
                  <Text style={styles.mcqOption}>2. {mcq['Option 2']}</Text>
                  <Text style={styles.mcqOption}>3. {mcq['Option 3']}</Text>
                  <Text style={styles.mcqOption}>4. {mcq['Option 4']}</Text>
                  <Text style={styles.mcqAnswer}>Answer: {mcq.Answer}</Text>
                </View>
              ))}
            </ScrollView>
            
            <Pressable
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowMCQModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      
      {/* Performance Stats Modal */}
      <Modal
        visible={showPerformanceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPerformanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.performanceModalContent]}>
            <Text style={styles.modalTitle}>Performance Statistics</Text>
            
            <View style={styles.performanceStat}>
              <Text style={styles.performanceStatTitle}>Top Performance</Text>
              <Text style={styles.performanceStatText}>
                {performanceData?.top?.student_name || 'N/A'} - 
                {performanceData?.top?.obtained_marks || '0'} marks
              </Text>
              <Text style={styles.performanceStatComment}>
                {performanceData?.top?.title || ''}
              </Text>
            </View>
            
            <View style={styles.performanceStat}>
              <Text style={styles.performanceStatTitle}>Average Performance</Text>
              <Text style={styles.performanceStatText}>
                {performanceData?.average?.student_name || 'N/A'} - 
                {performanceData?.average?.obtained_marks || '0'} marks
              </Text>
              <Text style={styles.performanceStatComment}>
                {performanceData?.average?.title || ''}
              </Text>
            </View>
            
            <View style={styles.performanceStat}>
              <Text style={styles.performanceStatTitle}>Lowest Performance</Text>
              <Text style={styles.performanceStatText}>
                {performanceData?.worst?.student_name || 'N/A'} - 
                {performanceData?.worst?.obtained_marks || '0'} marks
              </Text>
              <Text style={styles.performanceStatComment}>
                {performanceData?.worst?.title || ''}
              </Text>
            </View>
            
            <Pressable
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowPerformanceModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Add this with your other modals */}
<Modal
  visible={showEditModal}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setShowEditModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Edit Due Date</Text>
      
      <TouchableOpacity 
        style={styles.dateInput}
        onPress={() => {
          setDatePickerMode('date');
          setShowDatePicker(true);
        }}
      >
        <Text style={styles.dateInputText}>
          {newDueDate.toLocaleDateString()} {newDueDate.toLocaleTimeString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={newDueDate}
          mode={datePickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateTimeChange}
        />
      )}
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setShowEditModal(false)}
        >
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.confirmButton]}
          onPress={handleEditDueDate}
        >
          <Text style={styles.modalButtonText}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: '#000000',
    marginTop: 10,
  },dateInput: {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: 12,
  marginBottom: 20,
  backgroundColor: colors.lightGray,
},
dateInputText: {
  color: '#000000',
  fontSize: 16,
},
  tabsContainer: { 
    marginTop: 10,
    backgroundColor: colors.darkGray,
    height: 50,
  },
  tabsContent: {
    paddingHorizontal: 8,
    height: 50,
  },
  tab: { 
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginHorizontal: 3,
    marginVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.black,
    backgroundColor: colors.white,
    height: 40,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: '#000000',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 12,
  },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },dateInput: {
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: 12,
  marginBottom: 20,
  color: '#000000',
},
  taskTypeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  taskTypeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  taskDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskInfo: {
    color: '#000000',
    fontSize: 14,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor:'red',
    margin: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  assignButton: {
    backgroundColor: colors.secondary,
  },
  editButton: {
    backgroundColor: colors.info,
  },
  viewButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  markButton: {
    backgroundColor: colors.success,
  },
  mcqsButton: {
    backgroundColor: colors.purple,
  },
  emptyText: {
    color: '#000000',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#000000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.primary,
    width: '100%',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  noGradersText: {
    textAlign: 'center',
    padding: 20,
    color: '#000000',
    fontSize: 16,
  },
  // MCQ Modal styles
  mcqModalContent: {
    maxHeight: '80%',
  },
  mcqScrollView: {
    marginBottom: 20,
  },
  mcqItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  mcqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  mcqOption: {
    fontSize: 14,
    marginLeft: 10,
    marginBottom: 4,
    color: '#000000',
  },
  mcqAnswer: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
    color: colors.success,
  },
  // Performance Stats styles
  performanceModalContent: {
    maxHeight: '80%',
  },
  performanceButton: {
    backgroundColor: colors.info,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  performanceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  performanceStat: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  performanceStatTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  performanceStatText: {
    fontSize: 14,
    color: '#000000',
  },
  performanceStatComment: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.darkGray,
    marginTop: 5,
  },
});

export default TaskGetScreen;