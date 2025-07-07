import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {API_URL, Navbar} from '../ControlsAPI/Comps';
import {pick} from '@react-native-documents/picker';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/MaterialIcons';

const TaskSubmit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {taskData} = route.params || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [file, setFile] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize task data and validate
    console.log('TaskSubmit mounted with taskData:', JSON.stringify(taskData));
    if (!taskData) {
      Alert.alert('Error', 'Task data is missing');
      navigation.goBack();
    }
  }, []);

  // MCQ Functions
  const handleAnswerSelect = (questionId, answer) => {
    console.log(`Selected answer for question ${questionId}:`, answer);
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    const question = taskData.attachments.mcqs[currentQuestionIndex];
    const questionId = question.ID.toString();

    // Ensure user has selected an answer before proceeding
    if (!selectedAnswers[questionId]) {
      Alert.alert('Warning', 'Please select an answer before continuing');
      return;
    }

    setCurrentQuestionIndex(prev => prev + 1);
  };

  const getQuestionNumber = questionId => {
    const question = taskData.attachments.mcqs.find(
      q => q.ID.toString() === questionId,
    );
    return question
      ? question['Question NO'] ||
          taskData.attachments.mcqs.indexOf(question) + 1
      : 0;
  };

  const getQuestionProgress = () => {
    return `${currentQuestionIndex + 1}/${taskData.attachments.mcqs.length}`;
  };

  const renderMCQQuestion = () => {
    console.log('Rendering MCQ question. Current index:', currentQuestionIndex);
    if (
      !taskData?.attachments?.mcqs ||
      taskData.attachments.mcqs.length === 0
    ) {
      console.warn('No questions available in taskData');
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="error-outline" size={40} color="#E94560" />
          <Text style={styles.errorText}>
            No questions available for this quiz
          </Text>
        </View>
      );
    }

    const question = taskData.attachments.mcqs[currentQuestionIndex];
    console.log('Current question:', JSON.stringify(question));
    const options = [];

    // Extract options dynamically
    for (let i = 1; i <= 4; i++) {
      const optionKey = `Option ${i}`;
      if (question[optionKey] && question[optionKey].trim()) {
        options.push(question[optionKey]);
      }
    }
    console.log('Options for current question:', options);

    return (
      <View style={styles.questionContainer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((currentQuestionIndex + 1) /
                      taskData.attachments.mcqs.length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{getQuestionProgress()}</Text>
        </View>

        <Text style={styles.questionText}>{question.Question}</Text>

        {options.map((option, idx) => (
          <TouchableOpacity
            key={`option-${idx}`}
            style={[
              styles.optionButton,
              selectedAnswers[question.ID] === option && styles.selectedOption,
            ]}
            onPress={() => handleAnswerSelect(question.ID.toString(), option)}>
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.optionCircle,
                  selectedAnswers[question.ID] === option &&
                    styles.selectedCircle,
                ]}>
                {selectedAnswers[question.ID] === option && (
                  <Ionicons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  selectedAnswers[question.ID] === option &&
                    styles.selectedOptionText,
                ]}>
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.navigationButtons}>
          {currentQuestionIndex > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentQuestionIndex(prev => prev - 1)}>
              <Ionicons name="arrow-back" size={20} color="#555" />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentQuestionIndex < taskData.attachments.mcqs.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.primaryButton]}
              onPress={nextQuestion}>
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={confirmSubmitQuiz}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // File Submission Functions
  const pickFile = async () => {
    console.log('Attempting to pick file');
    try {
      const [res] = await pick({allowMultiSelection: false});
      console.log('File picked:', res);
      if (res) {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        // Check file extension if type is not available
        let fileType = res.type;
        if (!fileType) {
          const extension = res.name.split('.').pop().toLowerCase();
          if (extension === 'pdf') fileType = 'application/pdf';
          else if (extension === 'doc') fileType = 'application/msword';
          else if (extension === 'docx')
            fileType =
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        console.log('File type determined:', fileType);

        if (!allowedTypes.includes(fileType)) {
          Alert.alert('Invalid File Type', 'Please pick a PDF or Word file.');
          return;
        }

        setFile({uri: res.uri, name: res.name, type: fileType});
        setSubmissionStatus('File selected: ' + res.name);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      if (!err.isCancel) {
        Alert.alert('Error', 'Failed to select file: ' + err.message);
      }
    }
  };

  const confirmSubmitQuiz = () => {
    // Check if all questions have answers
    const unansweredQuestions = taskData.attachments.mcqs.filter(
      q => !selectedAnswers[q.ID],
    );

    console.log('Unanswered questions:', unansweredQuestions.length);

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`,
        [
          {text: 'Review Answers', style: 'cancel'},
          {text: 'Submit Anyway', onPress: submitQuizAnswers},
        ],
      );
    } else {
      Alert.alert('Submit Quiz', 'Are you sure you want to submit this quiz?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Submit', onPress: submitQuizAnswers},
      ]);
    }
  };

  const confirmSubmitFile = () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    Alert.alert(
      'Submit Assignment',
      'Are you sure you want to submit this file?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Submit', onPress: submitFile},
      ],
    );
  };

  const submitFile = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('Answer', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      });
      formData.append('student_id', taskData.studentId.toString());
      formData.append('task_id', taskData.task_id.toString());

      console.log('Submitting file with form data:', {
        file_name: file.name,
        file_type: file.type,
        student_id: taskData.studentId,
        task_id: taskData.task_id,
      });

      const response = await fetch(`${API_URL}/api/Students/submit-task-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log('File submit response status:', response.status);

      // Get both text and status for logging
      const responseText = await response.text();
      console.log('File submit response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed response:', result);
      } catch (e) {
        console.error('Failed to parse response:', e);
        result = {
          success: false,
          message: responseText || 'Invalid server response',
        };
      }

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      Alert.alert(
        result.success ? 'Success' : 'Success',
        result.message ||
          (result.success ? 'File uploaded successfully' : 'Unknown error'),
        [
          {
            text: 'OK',
            onPress: () => (result.success ? navigation.goBack() : null),
          },
        ],
      );
    } catch (error) {
      console.error('File submission error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit file. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Quiz Submission
  const submitQuizAnswers = async () => {
    setLoading(true);
    try {
      // Format answers in the expected way
      const answers = Object.entries(selectedAnswers).map(([key, value]) => {
        const qNo = getQuestionNumber(key);
        console.log(`Converting questionId ${key} to question number ${qNo}`);
        return {
          QNo: qNo,
          StudentAnswer: value,
        };
      });

      const payload = {
        student_id: taskData.studentId,
        task_id: taskData.task_id,
        Answer: answers,
      };

      console.log(
        'Submitting quiz answers with payload:',
        JSON.stringify(payload),
      );

      const response = await fetch(`${API_URL}/api/Students/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Quiz submit response status:', response.status);

      // Get full response text for logging
      const responseText = await response.text();
      console.log('Quiz submit response text:', responseText);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed quiz result:', result);
      } catch (e) {
        console.error('Failed to parse quiz result:', e);
        throw new Error('Failed to parse server response');
      }

      // Set quiz result with all necessary data
      setQuizResult({
        message: result.message || 'Your MCQ quiz has been submitted!',
        obtainedMarks: result['Obtained Marks'] || 0,
        totalMarks: result['Total Marks of Task'] || 0,
        quizData: result['Quiz Data'] || [],
        yourSubmissions: result['Your Submissions'] || [],
        correctAnswers:
          result['Your Submissions']?.filter(submission => {
            const question = result['Quiz Data']?.find(
              q => q['Question NO'] === submission.QNo,
            );
            return question && submission.StudentAnswer === question.Answer;
          }).length || 0,
        wrongAnswers:
          (result['Quiz Data']?.length || 0) -
          (result['Your Submissions']?.filter(submission => {
            const question = result['Quiz Data']?.find(
              q => q['Question NO'] === submission.QNo,
            );
            return question && submission.StudentAnswer === question.Answer;
          }).length || 0),
      });

      setResultModalVisible(true);
    } catch (error) {
      console.error('Quiz submission error:', error);
      Alert.alert('Error', 'Submission failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
      return <Ionicons name="picture-as-pdf" size={24} color="#E94560" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <Ionicons name="description" size={24} color="#4361EE" />;
    } else {
      return <Ionicons name="insert-drive-file" size={24} color="#555" />;
    }
  };

  // Determine what type of content to render based on task type
  const renderTaskContent = () => {
    console.log('Rendering content for task type:', taskData?.taskType);
    console.log('Task attachments:', JSON.stringify(taskData?.attachments));

    if (!taskData) return null;

    // Check if it's an MCQ task
    if (taskData.taskType === 'MCQS' && taskData.attachments?.mcqs) {
      return renderMCQQuestion();
    }
    // Default to file submission for all other task types or if not specified
    else {
      return renderFileSubmission();
    }
  };

  const renderFileSubmission = () => {
    console.log('Rendering file submission UI');
    return (
      <View style={styles.fileContainer}>
        <View style={styles.fileCard}>
          <View style={styles.fileInstructions}>
            <Ionicons name="info" size={24} color="#4361EE" />
            <Text style={styles.fileInstructionsText}>
              Please upload your assignment as a PDF or Word document
            </Text>
          </View>

          <TouchableOpacity style={styles.filePickerButton} onPress={pickFile}>
            <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
            <Text style={styles.filePickerText}>Select File</Text>
          </TouchableOpacity>

          {file && (
            <View style={styles.fileInfoContainer}>
              {getFileIcon()}
              <Text
                style={styles.fileInfoText}
                numberOfLines={1}
                ellipsizeMode="middle">
                {file.name}
              </Text>
              <TouchableOpacity onPress={() => setFile(null)}>
                <Ionicons name="cancel" size={24} color="#E94560" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitFileButton, !file && styles.disabledButton]}
            onPress={confirmSubmitFile}
            disabled={!file || loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Assignment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuizResultModal = () => {
    if (!quizResult) return null;

    const percentageScore =
      quizResult.totalMarks > 0
        ? (quizResult.obtainedMarks / quizResult.totalMarks) * 100
        : 0;

    return (
      <Modal visible={resultModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Quiz Results</Text>
              <Text style={styles.scoreMessage}>{quizResult.message}</Text>
            </View>

            <View style={styles.scoreContainer}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Obtained Marks</Text>
                <Text style={styles.scoreValue}>
                  {quizResult.obtainedMarks}
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Total Marks</Text>
                <Text style={styles.scoreValue}>{quizResult.totalMarks}</Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Correct Answers</Text>
                <Text style={styles.scoreValue}>
                  {quizResult.correctAnswers}/{quizResult.quizData.length}
                </Text>
              </View>
            </View>

            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>
                Score: {Math.round(percentageScore)}%
              </Text>
            </View>

            <View style={styles.answersContainer}>
              <Text style={styles.answersTitle}>Question-wise Results:</Text>
              {quizResult.quizData.map((question, index) => {
                const submission = quizResult.yourSubmissions.find(
                  s => s.QNo === question['Question NO'],
                );
                const isCorrect = submission?.StudentAnswer === question.Answer;

                return (
                  <View
                    key={index}
                    style={[
                      styles.answerItem,
                      isCorrect ? styles.correctAnswer : styles.wrongAnswer,
                    ]}>
                    <Text style={styles.questionText}>
                      Q{question['Question NO']}: {question.Question}
                    </Text>
                    <Text style={styles.answerText}>
                      Your Answer: {submission?.StudentAnswer || 'Not answered'}
                    </Text>
                    {!isCorrect && (
                      <Text style={styles.correctAnswerText}>
                        Correct Answer: {question.Answer}
                      </Text>
                    )}
                    <Text style={styles.pointsText}>
                      Points: {question.Points} {isCorrect ? '✓' : '✗'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setResultModalVisible(false);
                navigation.goBack();
              }}>
              <Text style={styles.closeModalButtonText}>
                Return to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Navbar
        title="Task Submission"
        userName={taskData?.studentname || 'Student'}
        des={'Student'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {loading && !resultModalVisible && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#4361EE" />
            <Text style={styles.loaderText}>Submitting...</Text>
          </View>
        )}

        <View style={styles.headerContainer}>
          <Text style={styles.title}>{taskData?.title || 'Task'}</Text>
          <View style={styles.taskInfoRow}>
            <Text style={styles.subtitle}>
              {taskData?.courseName || 'Unknown Course'}
            </Text>
            {taskData?.points && (
              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.pointsText}>{taskData.points} points</Text>
              </View>
            )}
          </View>
          {taskData?.dueDate && (
            <Text style={styles.dueDateText}>
              Due: {formatDateTime(taskData.dueDate)}
            </Text>
          )}
        </View>

        {renderTaskContent()}
      </ScrollView>

      {renderQuizResultModal()}
    </SafeAreaView>
  );
};

// Helper function to format date time
const formatDateTime = dateTimeString => {
  if (!dateTimeString) return 'N/A';
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    return dateTimeString;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  taskInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  pointsText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loaderText: {
    marginTop: 8,
    color: '#4361EE',
    fontSize: 14,
    fontWeight: '500',
  },
  // File submission styles
  fileContainer: {
    padding: 16,
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fileInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F1FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  fileInstructionsText: {
    marginLeft: 8,
    color: '#4361EE',
    flex: 1,
  },
  filePickerButton: {
    backgroundColor: '#4361EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  filePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  fileInfoText: {
    flex: 1,
    marginHorizontal: 12,
    color: '#495057',
  },
  submitFileButton: {
    backgroundColor: '#4361EE',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // MCQ styles
  questionContainer: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4361EE',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'right',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 24,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#4361EE',
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ADB5BD',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    borderColor: '#4361EE',
    backgroundColor: '#4361EE',
  },
  optionText: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  selectedOptionText: {
    color: '#4361EE',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
  },
  navButtonText: {
    marginHorizontal: 8,
    color: '#495057',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#4361EE',
    borderColor: '#4361EE',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    marginHorizontal: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4361EE',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 18,
    color: '#212529',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreBox: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    flex: 1,
    marginHorizontal: 5,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  percentageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4361EE',
  },
  answersContainer: {
    width: '100%',
    marginBottom: 20,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  answerItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  correctAnswer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  wrongAnswer: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderColor: '#E94560',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 3,
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#E94560',
    marginBottom: 3,
    fontStyle: 'italic',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  closeModalButton: {
    backgroundColor: '#4361EE',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskSubmit;
