import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    TextInput, 
    FlatList, 
    ActivityIndicator 
  } from 'react-native';
  import Pdf from 'react-native-pdf';
  import React, { useState, useEffect } from 'react';
  import { useFocusEffect } from '@react-navigation/native';
  import { API_URL, Navbar } from '../ControlsAPI/Comps';
  import RNFetchBlob from 'react-native-blob-util';
  import { Alert } from 'react-native';
  
  const Tasks = ({ navigation, route }) => {
    const { teacherId, graderId, teacherName, graderName, sessionName } = route.params;
    const [activeTab, setActiveTab] = useState('preassigned');
    const [tasks, setTasks] = useState({ PreAssignedTasks: [], CompletedTasks: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
  
    const handleViewPDF = async (pdfUrl) => {
      if (!pdfUrl) {
        Alert.alert("Error", "No PDF file available");
        return;
      }
    
      try {
        const { config, fs } = RNFetchBlob;
        const fileName = pdfUrl.split('/').pop();
        const filePath = `${fs.dirs.DownloadDir}/${fileName}`;
    
        const res = await config({
          fileCache: true,
          path: filePath,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            path: filePath,
            description: 'Downloading PDF',
          }
        }).fetch('GET', pdfUrl);
    
        const mimeType = 'application/pdf';
        RNFetchBlob.android.actionViewIntent(res.path(), mimeType);
    
      } catch (error) {
        console.error("PDF Error: ", error);
        Alert.alert("Error", error.message || "Could not open PDF.");
      }
    };
  
    const fetchTasks = async () => {
      try {
        setRefreshing(true);
        const response = await fetch(`${API_URL}/api/Grader/YourTask?grader_id=${graderId}&teacher_id=${teacherId}`);
        const data = await response.json();
        console.log(data)
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
  
    useFocusEffect(
      React.useCallback(() => {
        fetchTasks();
      }, [])
    );
  
    const filteredAndSortedTasks = () => {
      const taskList = activeTab === 'preassigned' 
        ? tasks.PreAssignedTasks || [] 
        : tasks.CompletedTasks || [];
      
      // Filter first
      const filtered = taskList.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Then sort - unmarked tasks first
      return [...filtered].sort((a, b) => {
        // If both are marked or both are unmarked, sort by title
        if (a.marking_status === b.marking_status) {
          return a.title.localeCompare(b.title);
        }
        // Unmarked comes before marked
        return a.marking_status === 'Marked' ? 1 : -1;
      });
    };
  
    const renderTaskCard = ({ item }) => (
      <View style={[
        styles.taskCard,
        item.marking_status === 'Marked' ? styles.markedCard : styles.unmarkedCard
      ]}>
        <View style={styles.cardHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={[
            styles.statusBadge,
            item.marking_status === 'Marked' ? styles.markedBadge : styles.unmarkedBadge
          ]}>
            <Text style={styles.statusText}>{item.marking_status}</Text>
          </View>
        </View>
        
        <View style={styles.taskInfoRow}>
          <Text style={styles.taskLabel}>Course:</Text>
          <Text style={styles.taskValue}>{item['Course Name']}</Text>
        </View>
        
        <View style={styles.taskInfoRow}>
          <Text style={styles.taskLabel}>Section:</Text>
          <Text style={styles.taskValue}>{item['Section Name']}</Text>
        </View>
        
        <View style={styles.taskInfoRow}>
          <Text style={styles.taskLabel}>Type:</Text>
          <Text style={styles.taskValue}>{item.type}</Text>
        </View>
        
        <View style={styles.taskInfoRow}>
          <Text style={styles.taskLabel}>Due:</Text>
          <Text style={styles.taskValue}>{new Date(item.due_date).toLocaleDateString()}</Text>
        </View>
        
        {activeTab === 'completed' && item.marking_status === 'Marked' && item.marking_info && (
          <View style={styles.markingSummary}>
            <Text style={styles.summaryTitle}>Performance Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryItem, styles.topStudent]}>
                <Text style={styles.summaryLabel}>Top</Text>
                <Text style={styles.summaryText}>{item.marking_info.top.student_name}</Text>
                <Text style={styles.summaryText}>{item.marking_info.top.obtained_marks} marks</Text>
                <Text style={styles.summaryGrade}>{item.marking_info.top.title}</Text>
              </View>
              
              <View style={[styles.summaryItem, styles.avgStudent]}>
                <Text style={styles.summaryLabel}>Average</Text>
                <Text style={styles.summaryText}>{item.marking_info.average.student_name}</Text>
                <Text style={styles.summaryText}>{item.marking_info.average.obtained_marks} marks</Text>
                <Text style={styles.summaryGrade}>{item.marking_info.average.title}</Text>
              </View>
              
              <View style={[styles.summaryItem, styles.worstStudent]}>
                <Text style={styles.summaryLabel}>Lowest</Text>
                <Text style={styles.summaryText}>{item.marking_info.worst.student_name}</Text>
                <Text style={styles.summaryText}>{item.marking_info.worst.obtained_marks} marks</Text>
                <Text style={styles.summaryGrade}>{item.marking_info.worst.title}</Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.fileButton}
            onPress={() => handleViewPDF(item.File)}>
            <Text style={styles.buttonText}>View File</Text>
          </TouchableOpacity>
          
          {activeTab === 'completed' ? (
            item.marking_status !== 'Marked' ? (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('marktask', { 
  taskId: item.task_id,
  taskname: item.title,
  points: item['Total Marks']

})}
              >
                <Text style={styles.buttonText}>Mark Now</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('marktask', { 
  taskId: item.task_id,
  taskname: item.title,
  points: item['Total Marks']
})}
              >
                <Text style={styles.buttonText}>View Submissions</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('TaskDetails', { taskId: item.task_id })}
            >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  
    return (
      <View style={styles.container}>
        <Navbar
          title="Tasks"
          userName={graderName}
          des={'Grader'}
          showBackButton={true}
          onLogout={() => navigation.replace('Login')}
        />
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#90a4ae"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'preassigned' && styles.activeTab]}
            onPress={() => setActiveTab('preassigned')}
          >
            <Text style={[styles.tabText, activeTab === 'preassigned' && styles.activeTabText]}>Pre-Assigned</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e88e5" />
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedTasks()}
            renderItem={renderTaskCard}
            keyExtractor={(item) => item.task_id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No {activeTab === 'preassigned' ? 'pre-assigned' : 'completed'} tasks found</Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={fetchTasks}
          />
        )}
      </View>
    );
  };
  export default Tasks;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f9ff',
    },
    header: {
      padding: 20,
      paddingTop: 50,
      backgroundColor: '#1e88e5',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: 'white',
    },
    sessionText: {
      fontSize: 14,
      color: '#e3f2fd',
      marginTop: 4,
    },
    searchContainer: {
      padding: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    searchInput: {
      height: 48,
      backgroundColor: '#f1f8ff',
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
      color: '#37474f',
      borderWidth: 1,
      borderColor: '#bbdefb',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    tabButton: {
      flex: 1,
      padding: 16,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: '#1e88e5',
    },
    tabText: {
      fontSize: 16,
      color: '#90a4ae',
      fontWeight: '500',
    },
    activeTabText: {
      color: '#1e88e5',
      fontWeight: '600',
    },
    listContainer: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      color: '#90a4ae',
      fontSize: 16,
    },
    taskCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    markedCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#4caf50',
    },
    unmarkedCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#ff9800',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    taskTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#263238',
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    markedBadge: {
      backgroundColor: '#4caf50',
    },
    unmarkedBadge: {
      backgroundColor: '#ff9800',
    },
    statusText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    taskInfoRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    taskLabel: {
      width: 80,
      fontSize: 14,
      color: '#607d8b',
      fontWeight: '500',
    },
    taskValue: {
      flex: 1,
      fontSize: 14,
      color: '#37474f',
    },
    markingSummary: {
      marginTop: 16,
      marginBottom: 12,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#263238',
      marginBottom: 8,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryItem: {
      flex: 1,
      padding: 8,
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    topStudent: {
      backgroundColor: '#e8f5e9',
    },
    avgStudent: {
      backgroundColor: '#fff8e1',
    },
    worstStudent: {
      backgroundColor: '#ffebee',
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#37474f',
      marginBottom: 4,
    },
    summaryText: {
      fontSize: 12,
      color: '#455a64',
      textAlign: 'center',
    },
    summaryGrade: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: '#1e88e5',
      padding: 12,
      borderRadius: 8,
      marginRight: 8,
      alignItems: 'center',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: '#4caf50',
      padding: 12,
      borderRadius: 8,
      marginRight: 8,
      alignItems: 'center',
    },
    fileButton: {
      flex: 1,
      backgroundColor: '#607d8b',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 14,
    },




  });