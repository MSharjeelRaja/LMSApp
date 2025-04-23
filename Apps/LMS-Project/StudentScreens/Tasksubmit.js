import { 
    StyleSheet, 
    Text, 
    View, 
    TouchableOpacity, 
    Modal, 
    Alert,
    ActivityIndicator
  } from 'react-native';
  import React, { useState, useEffect } from 'react';
  import { API_URL, Navbar } from '../ControlsAPI/Comps';
  import { pick } from '@react-native-documents/picker';
  import { useNavigation, useRoute } from '@react-navigation/native';

  const TaskSubmit = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { taskData } = route.params || {}; 
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [file, setFile] = useState(null);
    const [submissionStatus, setSubmissionStatus] = useState('');
    const [resultModalVisible, setResultModalVisible] = useState(false);
    const [quizResult, setQuizResult] = useState(null);
    const [loading, setLoading] = useState(false);
  
    // MCQ Functions
    const handleAnswerSelect = (questionId, answer) => {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    };
  
    const getQuestionNumber = (key) => {
      return taskData.attachments.mcqs.findIndex(q => q.ID === parseInt(key)) + 1;
    };
  
    const renderMCQQuestion = () => {
      const question = taskData.attachments.mcqs[currentQuestionIndex];
      
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            Q{currentQuestionIndex + 1}: {question.Question}
          </Text>
          
          {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option, idx) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                selectedAnswers[question.ID] === question[option] && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(question.ID, question[option])}
            >
              <Text style={styles.optionText}>{question[option]}</Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.navigationButtons}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setCurrentQuestionIndex(prev => prev - 1)}
              >
                <Text>Previous</Text>
              </TouchableOpacity>
            )}
            
            {currentQuestionIndex < taskData.attachments.mcqs.length - 1 ? (
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                <Text>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitQuizAnswers}
              >
                <Text>Submit Quiz</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    };
  
    // File Submission Functions
    const pickFile = async () => {
      try {
        const [res] = await pick({ allowMultiSelection: false });
        if (res) {
          const allowedTypes = ['application/pdf', 'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          const fileType = res.type || res.name.split('.').pop();
  
          if (!allowedTypes.includes(fileType)) {
            Alert.alert("Error", "Please pick a PDF or Word file.");
            return;
          }
  
          setFile({ uri: res.uri, name: res.name, type: res.type });
          setSubmissionStatus('File selected: ' + res.name);
        }
      } catch (err) {
        if (!err.isCancel) {
          Alert.alert("Error", "Failed to select file: " + err.message);
        }
      }
    };
  
    const submitFile = async () => {
        if (!file) {
          Alert.alert("Error", "Please select a file first");
          return;
        }
      
        setLoading(true);
        try {
          const formData = new FormData();
          // Proper file append format
          formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.type,
            // For Android, add this:
            // uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
          });
          formData.append('student_id', taskData.studentId.toString());
          formData.append('task_id', taskData.task_id.toString());
      console.log(taskData.task_id)
         
          const response = await fetch(`${API_URL}/api/Students/submit-task-file`, {
            method: 'POST',
            body: formData,
          });
      
          
          const responseText = await response.text();
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (e) {
            result = {
              success: false,
              message: responseText || 'Invalid server response'
            };
          }
      
          if (!response.ok) {
            throw new Error(result.message || `Server error: ${response.status}`);
          }
      
          Alert.alert(
            result.success ? "Success" : "Error", 
            result.message || (result.success ? 'File uploaded successfully' : 'Unknown error')
          );
        } catch (error) {
          Alert.alert(
            "Error", 
            error.message || 'Failed to submit file. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      };
    // Quiz Submission
    const submitQuizAnswers = async () => {
      setLoading(true);
      try {
        const answers = Object.entries(selectedAnswers).map(([key, value]) => ({
          QNo: getQuestionNumber(key),
          StudentAnswer: value
        }));
  
        const response = await fetch(`${API_URL}/api/Students/submit-quiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: taskData.studentId,
            task_id: taskData.task_id,
            Answer: answers,
          }),
        });
  
        const result = await response.json();
        setQuizResult(result);
        setResultModalVisible(true);
      } catch (error) {
        Alert.alert("Error", "Submission failed: " + error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <View style={styles.container}>
         <Navbar
        title="Task Submission"
        userName={taskData.studentname || 'Student'} // Add fallback
        des={'Student'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />
  
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
  
        {taskData.taskType === 'MCQS' ? (
          renderMCQQuestion()
        ) : (
          <View style={styles.fileContainer}>
            <Text style={styles.title}>{taskData.title}</Text>
            <Text style={styles.subtitle}>Course: {taskData.courseName}</Text>
            
            <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
              <Text>Select File</Text>
            </TouchableOpacity>
  
            {submissionStatus && <Text style={styles.status}>{submissionStatus}</Text>}
  
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={submitFile}
              disabled={!file}
            >
              <Text>Submit Assignment</Text>
            </TouchableOpacity>
          </View>
        )}
  
        {/* Result Modal */}
        <Modal visible={resultModalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            {quizResult && (
              <>
                <Text style={styles.resultTitle}>Quiz Results</Text>
                <Text>Correct Answers: {quizResult.correct_answers}</Text>
                <Text>Wrong Answers: {quizResult.wrong_answers}</Text>
                <Text>Total Points: {quizResult.obtained_points}/{taskData.points}</Text>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setResultModalVisible(false);
                    navigation.goBack();
                  }}
                >
                  <Text>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    loader: {
      position: 'absolute',
      alignSelf: 'center',
      top: '50%'
    },
    fileContainer: {
      alignItems: 'center',
      marginTop: 20
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 20
    },
    fileButton: {
      backgroundColor: '#e7e7e7',
      padding: 15,
      borderRadius: 8,
      marginBottom: 20
    },
    status: {
      color: 'green',
      marginBottom: 20
    },
    submitButton: {
      backgroundColor: '#2196F3',
      padding: 15,
      borderRadius: 8,
      width: '80%',
      alignItems: 'center'
    },
    questionContainer: {
      marginTop: 20,
      padding: 16
    },
    questionText: {
      fontSize: 18,
      marginBottom: 20
    },
    optionButton: {
      backgroundColor: '#f0f0f0',
      padding: 15,
      borderRadius: 8,
      marginVertical: 5
    },
    selectedOption: {
      backgroundColor: '#2196F3',
      borderColor: '#1976D2'
    },
    optionText: {
      fontSize: 16
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20
    },
    navButton: {
      backgroundColor: '#e0e0e0',
      padding: 10,
      borderRadius: 5
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    resultTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20
    },
    modalButton: {
      backgroundColor: '#2196F3',
      padding: 15,
      borderRadius: 8,
      marginTop: 20
    }
  });
  
  export default TaskSubmit;