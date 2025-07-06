import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {API_URL, Navbar} from '../ControlsAPI/Comps';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../ControlsAPI/colors';

const Task = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('ongoing');
  const [tasks, setTasks] = useState({
    ongoing: [],
    upcoming: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedFilter, setCompletedFilter] = useState('All');

  const userData = route.params?.userData;
  const Tid = userData?.id;

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/Students/task/details?student_id=${Tid}`,
      );
      const data = await response.json();
console.log('task data:', data); // ✅ Properly logs the object


      setTasks({
        ongoing: data.TaskDetails.Active_Tasks,

        upcoming: data.TaskDetails.Upcoming_Tasks,
        completed: data.TaskDetails.Completed_Tasks,
      });
      console.log(tasks['ongoing']);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const renderTabButton = (title, value) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === value && styles.activeTab]}
      onPress={() => setActiveTab(value)}>
      <Text
        style={[styles.tabText, activeTab === value && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const getTypeColor = type => {
    const colors = {
      Quiz: '#4CAF50',
      Assignment: '#2196F3',
      MCQS: '#9C27B0',
      LabTask: '#FF9800',
      Default: '#607D8B',
    };
    return colors[type] || colors.Default;
  };
 useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [Tid]),
  );

 
  const calculateTimeLeft = startDate => {
    const start = new Date(startDate);
    const now = new Date();
    const diff = start - now;

    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0 && days === 0) timeString += `${minutes}m`;

    return timeString.trim();
  };

  const renderTaskItem = ({item}) => {
    const timeLeft = calculateTimeLeft(item.start_date);
    const typeColor = getTypeColor(item.type);
    const isSubmitted = item.IsAttempted === 'Yes';

    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => {
          if (activeTab === 'ongoing') {
            if (isSubmitted) {
              // Show alert or navigate to a view-only screen
              alert('Task already submitted');
            } else {
              navigation.navigate('Tasksubmit', {
                taskData: {
                  ...item,
                  studentname: userData.name,
                  studentId: Tid,
                  taskType: item.type,
                  courseName: item.course_name,
                  dueDate: item.due_date,
                  points: item.points,
                  attachments: {
                    questionFile: item.File,
                    submissionFile: item.Your_Submission,
                    mcqs: item.MCQS || null,
                    markedStatus: item.IsMarked,
                    obtainedPoints: item.obtained_points,
                  },
                },
              });
            }
          }
        }}>
        <View style={styles.taskHeader}>
          <Text style={styles.courseName}>{item.course_name}</Text>
          <View style={[styles.typeBadge, {backgroundColor: typeColor}]}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>

        <Text style={styles.taskTitle}>{item.title}</Text>

        <View style={styles.detailRow}>
          <Icon name="person" size={14} color="#666" />
          <Text style={styles.detailText}>{item.creator_name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="schedule" size={14} color="#666" />
          <Text style={styles.detailText}>
            Due: {new Date(item.due_date).toLocaleDateString()} •{' '}
            {new Date(item.due_date).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="star" size={14} color="#666" />
          <Text style={styles.detailText}>{item.points} Points</Text>
        </View>

        {activeTab === 'ongoing' && (
          <View style={styles.statusRow}>
            <View
              style={[
                styles.submissionBadge,
                isSubmitted ? styles.submittedBadge : styles.notSubmittedBadge,
              ]}>
              <Text style={styles.submissionText}>
                {isSubmitted ? 'Submitted' : 'Not Submitted'}
              </Text>
            </View>
            {isSubmitted && (
              <Text style={styles.submissionDate}>
                {new Date(item.Submission_Date_Time).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {activeTab === 'upcoming' && timeLeft && (
          <View style={styles.timerContainer}>
            <Icon name="notifications-active" size={14} color="#FF5252" />
            <Text style={styles.timerText}>Starts in {timeLeft}</Text>
          </View>
        )}

        {activeTab === 'completed' && (
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusText,
                {color: item.IsMarked === 'Yes' ? '#4CAF50' : '#FF5722'},
              ]}>
              {item.IsMarked === 'Yes' ? 'Marked' : 'Pending'}
            </Text>
            {item.obtained_points !== undefined && (
              <Text style={styles.pointsText}>
                {item.obtained_points}/{item.points} Points
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Tasks"
        userName={userData?.name}
        des={'Student'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />

      <View style={styles.tabContainer}>
        {renderTabButton('Ongoing', 'ongoing')}
        {renderTabButton('Upcoming', 'upcoming')}
        {renderTabButton('Completed', 'completed')}
      </View>

      {activeTab === 'completed' && (
        <View style={styles.dropdownContainer}>
          <Text style={styles.filterLabel}>Filter: </Text>
          <TouchableOpacity
            style={[
              styles.dropdownOption,
              completedFilter === 'All' && styles.selectedOption,
            ]}
            onPress={() => setCompletedFilter('All')}>
            <Text style={{color:colors.black}}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dropdownOption,
              completedFilter === 'Marked' && styles.selectedOption,
            ]}
            onPress={() => setCompletedFilter('Marked')}>
            <Text style={{color:colors.black}}>Marked</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dropdownOption,
              completedFilter === 'Pending' && styles.selectedOption,
            ]}
            onPress={() => setCompletedFilter('Pending')}>
            <Text style={{color:colors.black}}>Pending</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={
          activeTab === 'completed'
            ? tasks.completed.filter(task => {
                if (completedFilter === 'All') return true;
                if (completedFilter === 'Marked')
                  return task.IsMarked === 'Yes';
                if (completedFilter === 'Pending')
                  return task.IsMarked !== 'Yes';
              })
            : tasks[activeTab]
        }
        renderItem={renderTaskItem}
        keyExtractor={item => item.task_id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{`No ${activeTab} tasks found`}</Text>
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  timerText: {
    color: '#FF5252',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
    flexWrap: 'wrap',
  },

  filterLabel: {
    fontWeight: 'bold',
    color: '#334155',
  },

  dropdownOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    
  },

  selectedOption: {
    backgroundColor: '#93C5FD',
    borderColor: '#3B82F6',
  
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
  pointsText: {
    fontSize: 12,
    color: '#2196F3',

    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  submissionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  submittedBadge: {
    backgroundColor: '#4CAF50',
  },
  notSubmittedBadge: {
    backgroundColor: '#FF5722',
  },
  submissionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  submissionDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
});

export default Task;
