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
  Alert
} from 'react-native';
import colors from '../ControlsAPI/colors';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TaskGetScreen = ({ navigation, route }) => {
  const Tid = global.Tid;
  const userData = route.params?.userData || {};
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [tasks, setTasks] = useState({
    completed: [],
    upcoming: [],
    ongoing: [],
    unmarked: []
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/Teachers/task/get?teacher_id=${Tid}`);
      const data = await response.json();
      
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

  const handleAssignGrader = (taskId) => {
   navigation.navigate('AssignGrader', { taskId });
  };

  const handleEditDates = (taskId) => {
    Alert.alert("Edit Dates", `Edit dates for task ${taskId}`);
    // Implement your edit dates logic here
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteTaskConfirmed(taskId) }
      ]
    );
  };

  const deleteTaskConfirmed = (taskId) => {
    Alert.alert("Success", `Task ${taskId} deleted (simulated)`);
    // Implement your delete logic here
  };

  const handleViewSubmissions = (taskId) => {
   navigation.navigate('ViewSubmissions', { taskId });
  };

  const handleViewQuestions = (taskId) => {
    Alert.alert("View Questions", `View questions for task ${taskId}`);
    // Implement your view questions logic here
  };

  const handleMarkTask = (taskId) => {
    Alert.alert("Mark Task", `Mark task ${taskId}`);
    // Implement your mark task logic here
  };

  const renderTaskButtons = (task) => {
    switch (activeTab) {
      case 'upcoming':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.assignButton]}
              onPress={() => handleAssignGrader(task.task_id)}
            >
              <Icon name="person-add" size={16} color="white" />
              <Text style={styles.buttonText}>Assign Grader</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.editButton]}
              onPress={() => handleEditDates(task.task_id)}
            >
              <Icon name="edit" size={16} color="white" />
              <Text style={styles.buttonText}>Edit Dates</Text>
            </TouchableOpacity>
            
            {task.File && (
              <TouchableOpacity 
                style={[styles.button, styles.viewButton]}
                onPress={() => handleViewFile(task.File)}
              >
                <Icon name="visibility" size={16} color="white" />
                <Text style={styles.buttonText}>View File</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]}
              onPress={() => handleDeleteTask(task.task_id)}
            >
              <Icon name="delete" size={16} color="white" />
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'completed':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.viewButton]}
              onPress={() => handleViewSubmissions(task.task_id)}
            >
              <Icon name="list-alt" size={16} color="white" />
              <Text style={styles.buttonText}>View Submissions</Text>
            </TouchableOpacity>
            
            {task.MCQS && (
              <TouchableOpacity 
                style={[styles.button, styles.viewButton]}
                onPress={() => handleViewQuestions(task.task_id)}
              >
                <Icon name="question-answer" size={16} color="white" />
                <Text style={styles.buttonText}>View Questions</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'unmarked':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.assignButton]}
              onPress={() => handleAssignGrader(task.task_id)}
            >
              <Icon name="person-add" size={16} color="white" />
              <Text style={styles.buttonText}>Assign Grader</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.markButton]}
              onPress={() => handleMarkTask(task.task_id)}
            >
              <Icon name="check-circle" size={16} color="white" />
              <Text style={styles.buttonText}>Mark Task</Text>
            </TouchableOpacity>
            
            {task.File && (
              <TouchableOpacity 
                style={[styles.button, styles.viewButton]}
                onPress={() => handleViewFile(task.File)}
              >
                <Icon name="visibility" size={16} color="white" />
                <Text style={styles.buttonText}>View File</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      default:
        return null;
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
        
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#000000" />
          <Text style={styles.taskInfo}>Start: {formatDate(item.start_date)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color="#000000" />
          <Text style={styles.taskInfo}>Due: {formatDate(item.due_date)}</Text>
        </View>
      </View>
      
      {renderTaskButtons(item)}
    </View>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ongoing':
        return (
          <FlatList
            data={tasks.ongoing}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.task_id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No ongoing tasks</Text>}
            contentContainerStyle={styles.listContent}
          />
        );
      case 'upcoming':
        return (
          <FlatList
            data={tasks.upcoming}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.task_id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No upcoming tasks</Text>}
            contentContainerStyle={styles.listContent}
          />
        );
      case 'completed':
        return (
          <FlatList
            data={tasks.completed}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.task_id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No completed tasks</Text>}
            contentContainerStyle={styles.listContent}
          />
        );
      case 'unmarked':
        return (
          <FlatList
            data={tasks.unmarked}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.task_id.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No unmarked tasks</Text>}
            contentContainerStyle={styles.listContent}
          />
        );
      default:
        return null;
    }
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
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.tabsContent}
            >
              <TouchableOpacity
                style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
                onPress={() => setActiveTab('ongoing')}
              >
                <Icon name="hourglass-full" size={16} color={activeTab === 'ongoing' ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
                  Ongoing ({tasks.ongoing.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                onPress={() => setActiveTab('upcoming')}
              >
                <Icon name="event-upcoming" size={16} color={activeTab === 'upcoming' ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                  Upcoming ({tasks.upcoming.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                onPress={() => setActiveTab('completed')}
              >
                <Icon name="check-circle" size={16} color={activeTab === 'completed' ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                  Completed ({tasks.completed.length})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'unmarked' && styles.activeTab]}
                onPress={() => setActiveTab('unmarked')}
              >
                <Icon name="assignment-late" size={16} color={activeTab === 'unmarked' ? '#FFFFFF' : '#000000'} />
                <Text style={[styles.tabText, activeTab === 'unmarked' && styles.activeTabText]}>
                  Unmarked ({tasks.unmarked.length})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          <View style={styles.tabContent}>
            {renderTabContent()}
          </View>
        </>
      )}
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
  },
  tabsContainer: { marginTop:10,
    backgroundColor: colors.darkGray,
    height: 50, // Reduced height
  },
  tabsContent: {
   
    paddingHorizontal: 8,
    height: 50, // Match container height
  },
  tab: { margin:20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4, // Reduced padding
    marginHorizontal: 3,
    marginVertical: 6, // Center vertically
    borderRadius: 16,
    backgroundColor: colors.gray,
    height: 40, // Fixed height
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: '#000000',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12, // Smaller font
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
    paddingVertical: 6, // Slightly reduced
    borderRadius: 8,
    margin: 4,
  },
  buttonText: {
    color: '#FFFFFF', // Keep white for button text for contrast
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
  emptyText: {
    color: '#000000',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default TaskGetScreen;