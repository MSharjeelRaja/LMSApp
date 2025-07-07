import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import {API_URL, Navbar} from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../ControlsAPI/colors';

const JMarkTask = ({navigation, route}) => {
  // Route params
  const {taskId, taskname, points, userData = {}} = route.params;
  console.log('Task ID:', taskId);
  console.log('Task Name:', taskname);
  console.log('Points:', points);
  console.log('User Data:', userData);
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Task information state
  const [taskInfo, setTaskInfo] = useState({
    title: taskname,
    assignment: '',
    totalPoints: points,
    totalStudents: 0,
    submitted: 0,
    pending: 0,
  });

  // Fetch students data
  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/Grader/ListOfStudent?task_id=${taskId}`,
      );
      const data = await response.json();

      if (data.message === 'Fetched Successfully') {
        const studentsList = data['assigned Tasks'] || [];
        setStudents(studentsList);

        // Initialize marks
        const initialMarks = {};
        studentsList.forEach(student => {
          if (student?.Student_id !== undefined) {
            initialMarks[student.Student_id] =
              student.ObtainedMarks?.toString() || '';
          }
        });
        setMarks(initialMarks);

        // Update task info
        setTaskInfo(prev => ({
          ...prev,
          totalStudents: studentsList.length,
          submitted: studentsList.filter(s => s?.Answer !== null).length,
          pending: studentsList.filter(s => s?.Answer === null).length,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and refresh
  useEffect(() => {
    fetchStudents();
  }, []);
  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      const query = searchQuery.toLowerCase();
      return (
        student.name?.toLowerCase().includes(query) ||
        student.RegNo?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const marksA = parseInt(marks[a.Student_id] || 0);
      const marksB = parseInt(marks[b.Student_id] || 0);
      return marksB - marksA;
    });

  // Handle viewing submission files
  const handleViewFile = fileUrl => {
    if (!fileUrl) {
      Alert.alert('Error', 'No file available');
      return;
    }
    Linking.openURL(fileUrl).catch(() =>
      Alert.alert('Error', 'Could not open file'),
    );
  };

  const handleMarkChange = (studentId, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '' || parseInt(numericValue) <= points) {
      setMarks(prev => ({...prev, [studentId]: numericValue}));
    }
  };

  // Submission handling
  const submitResults = async () => {
    const incomplete = students.filter(
      student =>
        marks[student.Student_id] === '' ||
        marks[student.Student_id] === undefined,
    );

    if (incomplete.length > 0) {
      Alert.alert(
        'Unassigned Marks',
        "Some students don't have marks assigned. Assign 0 marks to them?",
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Continue',
            onPress: () => {
              const updatedMarks = {...marks};
              incomplete.forEach(student => {
                updatedMarks[student.Student_id] = '0';
              });
              setMarks(updatedMarks);
              performSubmission();
            },
          },
        ],
      );
    } else {
      performSubmission();
    }
  };

  // Actual submission logic
  const performSubmission = async () => {
    try {
      setSubmitting(true);

      const submissions = students.map(student => ({
        student_id: student.Student_id,
        obtainedMarks: marks[student.Student_id]
          ? parseInt(marks[student.Student_id])
          : 0,
      }));

      const response = await fetch(
        `${API_URL}/api/Grader/SubmitTaskResultList`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({task_id: taskId, submissions}),
        },
      );

      const result = await response.json();
      if (result.message === 'Submitted Successfully') {
        Alert.alert('Success', 'Marks submitted successfully', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Student list item component
  const StudentCard = ({item}) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <Text style={styles.studentName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.regNo}>{item.RegNo || 'N/A'}</Text>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            item.Answer ? styles.submittedBadge : styles.pendingBadge,
          ]}>
          <Text style={styles.statusText}>
            {item.Answer ? 'Submitted' : 'Pending'}
          </Text>
        </View>

        {item.Answer && (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewFile(item.Answer)}>
            <Icon name="visibility" size={18} color={colors.primary} />
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.marksInput}
        placeholder={`0-${points}`}
        placeholderTextColor="#888"
        keyboardType="numeric"
        value={marks[item.Student_id] || ''}
        onChangeText={v => handleMarkChange(item.Student_id, v)}
        maxLength={String(points).length}
        editable={!submitting}
      />
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar
          title="Mark Task"
          userName={userData?.name}
          des="Teacher"
          onLogout={() => navigation.replace('Login')}
          showBackButton={true}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar
        title="Mark Task"
        userName={userData?.name}
        des="Teacher"
        onLogout={() => navigation.replace('Login')}
        showBackButton={true}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        style={styles.scrollView}>
        {/* Task Header */}
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{taskInfo.title}</Text>
          <Text style={styles.taskSubtitle}>{taskname}</Text>

          <View style={styles.taskStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{taskInfo.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.submittedStat]}>
                {taskInfo.submitted}
              </Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.pendingStat]}>
                {taskInfo.pending}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Students List */}
        <FlatList
          data={filteredStudents}
          renderItem={({item}) => <StudentCard item={item} />}
          keyExtractor={item => item.Student_id.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={submitResults}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="check" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Marks</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#333',
    fontSize: 16,
  },
  taskHeader: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 12,
    borderRadius: 10,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 16,
    color: 'black',
    marginBottom: 16,
  },
  taskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  submittedStat: {
    color: '#28a745',
  },
  pendingStat: {
    color: '#ffc107',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#333',
    fontSize: 16,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  regNo: {
    fontSize: 14,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  submittedBadge: {
    backgroundColor: '#d4edda',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    marginLeft: 4,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  marksInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#aaa',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default JMarkTask;
