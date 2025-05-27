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
  Linking
} from 'react-native';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../ControlsAPI/colors';
import { useState, useEffect } from 'react';
import Pdf from 'react-native-pdf';
import { Modal } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import Share from 'react-native-share';

const MarkTask = ({ navigation, route }) => {
  // Route params
  const taskId = route?.params?.taskId || 0;
  const taskName = route?.params?.taskName || "Assignment";
  const totalMarks = route?.params?.totalMarks || 20;
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState('');
 var  userData = route.params?.userData || {};
  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [marks, setMarks] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Task information state
  const [taskInfo, setTaskInfo] = useState({
    title: "",
    assignment: "",
    totalPoints: 0,
    totalStudents: 0,
    submitted: 0,
    pending: 0
  });

  // Fetch students when component mounts
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter and sort students
  const filteredStudents = students
    .filter(student => {
      return student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             student.RegNo?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const marksA = parseInt(marks[a.Student_id] || 0);
      const marksB = parseInt(marks[b.Student_id] || 0);
      return marksB - marksA;
    });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/Grader/ListOfStudent?task_id=${taskId}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.message === "Fetched Successfully") {
        const studentsList = data['assigned Tasks'] || [];
        setStudents(studentsList);

        // Initialize marks
        const initialMarks = {};
        studentsList.forEach(student => {
          if (student?.Student_id !== undefined) {
            initialMarks[student.Student_id] = 
              student.ObtainedMarks?.toString() || "";
          }
        });
        setMarks(initialMarks);

        // Set task info
        setTaskInfo({
          title: route?.params?.taskTitle || "Compiler Construction",
          assignment: route?.params?.assignmentCode || "CC-Week1-Assignment#(1)-Assignment01",
          totalPoints: totalMarks,
          totalStudents: studentsList.length,
          submitted: studentsList.filter(s => s?.Answer !== null).length,
          pending: studentsList.filter(s => s?.Answer === null).length
        });
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err.message || "Network error - please try again");
      Alert.alert("Error", err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = async (pdfUrl) => {
    if (!pdfUrl) {
      Alert.alert("Error", "No PDF file available");
      return;
    }
  
    try {
      const { config, fs } = RNFetchBlob;
      const fileName = pdfUrl.split('/').pop();
      const filePath = `${fs.dirs.DownloadDir}/${fileName}`;
  
      // Download the file
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
  
      // Open the file
      const mimeType = 'application/pdf';
      RNFetchBlob.android.actionViewIntent(res.path(), mimeType);
  
    } catch (error) {
      console.error("PDF Error: ", error);
      Alert.alert("Error", error.message || "Could not open PDF");
    }
  };

  // Mark input handler
  const handleMarkChange = (studentId, value) => {
    if (studentId === undefined || studentId === null) {
      console.error("Invalid student ID in handleMarkChange");
      return;
    }
    
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '' || parseInt(numericValue, 10) <= totalMarks) {
      setMarks(prev => ({ ...prev, [studentId]: numericValue }));
    }
  };

  // Submission handling
  const submitResults = async () => {
    const incompleteStudents = students.filter(
      student => student && student.Student_id && 
      (marks[student.Student_id] === "" || marks[student.Student_id] === undefined)
    );
  
    if (incompleteStudents.length > 0) {
      Alert.alert(
        "Unassigned Marks",
        "Some students don't have marks assigned. Would you like to assign 0 marks to them?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Assign 0", 
            onPress: () => {
              const updatedMarks = {...marks};
              incompleteStudents.forEach(student => {
                if (student && student.Student_id) {
                  updatedMarks[student.Student_id] = "0";
                }
              });
              setMarks(updatedMarks);
              performSubmission();
            }
          }
        ]
      );
    } else {
      performSubmission();
    }
  };

  // Actual submission logic
  const performSubmission = async () => {
    try {
      setSubmitting(true);
      
      // Prepare submission data with safe access
      const submissions = students
        .filter(student => student && student.Student_id !== undefined)
        .map(student => ({
          student_id: student.Student_id,
          obtainedMarks: marks[student.Student_id] && marks[student.Student_id].length > 0 ? 
            parseInt(marks[student.Student_id], 10) : 0
        }));
      
      const requestData = {
        task_id: taskId,
        submissions: submissions
      };
      
      console.log("Request Data:", requestData);
      const response = await fetch(`${API_URL}/api/Grader/SubmitTaskResultList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      console.log("API Response:", result);
      
      if (result.message === "Submitted Successfully" || response.ok) {
        Alert.alert(
          "Success",
          "Marks submitted successfully",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to submit marks");
      }
    } catch (err) {
      Alert.alert("Error", "Network error - please try again");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Student list item renderer
  const renderStudent = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name || "Unknown Student"}</Text>
        <Text style={styles.regNo}>{item.RegNo || "No ID"}</Text>
        
        <View style={[
          styles.submissionStatusContainer, 
          { backgroundColor: item.Answer ? '#E8F5E9' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.submissionStatus, 
            { color: item.Answer ? '#4CAF50' : '#F44336' }
          ]}>
            {item.Answer ? 'Submitted' : 'Not Submitted'}
          </Text>
        </View>
      </View>

      {item.Answer && (
        <TouchableOpacity 
          style={styles.viewFileButton}
          onPress={() => handleViewPDF(item.Answer)}
          disabled={!item.Answer}
        >
          <Icon name="description" size={18} color="#2196F3" />
          <Text style={styles.viewFileText}>View File</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.marksInput}
        placeholder={`Marks (0-${totalMarks})`}
        keyboardType="numeric"
        value={marks[item.Student_id] || ""}
        onChangeText={(v) => handleMarkChange(item.Student_id, v)}
        maxLength={String(totalMarks).length}
        editable={!submitting}
      />
    </View>
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
         <Navbar
               title="Mark Task"
               userName={userData?.name || ''}
               des={'Teacher Dashboard'}
               onLogout={() => navigation.replace('Login')}
               showBackButton={true}
             />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar
          title="Mark Task"
          onLogout={() => navigation.replace('Login')}
          showBackButton={true}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Icon name="error" size={50} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchStudents}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.container}>
        <Navbar
              title="Teacher Tasks"
              userName={userData?.name || ''}
              des={'Teacher Dashboard'}
              onLogout={() => navigation.replace('Login')}
              showBackButton={true}
            />
      <ScrollView>
        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={(item, index) => `${item.Student_id}_${index}`}
          ListHeaderComponent={
            <>
              <View style={styles.taskInfoCard}>
                <Text style={styles.taskTitle}>{taskInfo.title}</Text>
                <Text style={styles.assignmentCode}>{taskInfo.assignment}</Text>
                <View style={styles.badgeContainer}>
                  <View style={styles.assignmentBadge}>
                    <Text style={styles.badgeText}>Assignment</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.badgeText}>{taskInfo.totalPoints} pts</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: '#E8EAF6' }]}>
                  <Text style={styles.statValue}>{taskInfo.totalStudents}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={styles.statValue}>{taskInfo.submitted}</Text>
                  <Text style={styles.statLabel}>Submitted</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={styles.statValue}>{taskInfo.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>

              <View style={styles.filterContainer}>
                <View style={styles.searchContainer}>
                  <Icon name="search" size={24} color="#9E9E9E" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search students..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    editable={!submitting}
                  />
                </View>
              </View>
            </>
          }
          ListFooterComponent={
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={submitResults}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon name="check" size={24} color="white" />
                  <Text style={styles.submitButtonText}>Submit Results</Text>
                </>
              )}
            </TouchableOpacity>
          }
          contentContainerStyle={styles.listContent}
        />
      </ScrollView>

      {/* PDF Viewer Modal */}
      <Modal
        visible={pdfVisible}
        animationType="slide"
        onRequestClose={() => setPdfVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity 
              onPress={() => setPdfVisible(false)} 
              style={styles.pdfCloseButton}
            >
              <Icon name="close" size={24} color="#fff" />
              <Text style={styles.pdfCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
          {pdfUri ? (
            <Pdf
              source={{ uri: pdfUri, cache: true }}
              style={styles.pdfViewer}
              onError={(error) => {
                console.error('PDF error:', error);
                Alert.alert('Error', 'Failed to load PDF');
                setPdfVisible(false);
              }}
            />
          ) : (
            <View style={styles.pdfErrorContainer}>
              <Icon name="error" size={50} color="#F44336" />
              <Text style={styles.pdfErrorText}>No PDF file available</Text>
              <TouchableOpacity 
                style={styles.pdfCloseButton}
                onPress={() => setPdfVisible(false)}
              >
                <Text style={styles.pdfCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  taskInfoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 13,
    marginBottom: 16,
    elevation: 2,
  
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.title,
    marginBottom: 8,
  },
  assignmentCode: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  assignmentBadge: {
    backgroundColor: colors.red1,
    color: 'white',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  pointsBadge: {
    backgroundColor: colors.primaryDark,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    elevation: 1,
  
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color:colors.black,
  },
  statLabel: {
    fontSize: 14,
    color:'rgb(73, 72, 72)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 11,
    elevation: 1,
  
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  studentInfo: {
    marginBottom: 16,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  regNo: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  submissionStatusContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  submissionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  marksInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#333',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#333',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#757575',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
});

export default MarkTask;