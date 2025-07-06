import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  SafeAreaView,
  Alert,
  Animated,
  SectionList,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import {API_URL, Navbar} from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import {useAlert} from '../ControlsAPI/alert';

const ExamResultModal = ({visible, onClose, examResult}) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Exam Results</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {examResult &&
          examResult.exam_results &&
          Object.keys(examResult.exam_results).length > 0 ? (
            Object.entries(examResult.exam_results).map(([examType, exams]) => (
              <View key={examType} style={styles.examTypeContainer}>
                <Text style={styles.examTypeHeader}>{examType} Exam</Text>

                {exams.map((exam, index) => (
                  <View
                    key={`${examType}-${index}`}
                    style={styles.examDetailContainer}>
                    <View style={styles.examMetaRow}>
                      <Text style={styles.examMetaLabel}>Status:</Text>
                      <Text
                        style={[
                          styles.examMetaValue,
                          exam.status === 'Declared'
                            ? styles.statusDeclared
                            : styles.statusPending,
                        ]}>
                        {exam.status}
                      </Text>
                    </View>

                    <View style={styles.examMetaRow}>
                      <Text style={styles.examMetaLabel}>Total Marks:</Text>
                      <Text style={styles.examMetaValue}>
                        {exam.total_marks}
                      </Text>
                    </View>

                    <View style={styles.examMetaRow}>
                      <Text style={styles.examMetaLabel}>Obtained Marks:</Text>
                      <Text style={styles.examMetaValue}>
                        {exam.obtained_marks || 'Not available'}
                      </Text>
                    </View>

                    <View style={styles.examMetaRow}>
                      <Text style={styles.examMetaLabel}>Solid Marks:</Text>
                      <Text style={styles.examMetaValue}>
                        {exam.solid_marks}
                      </Text>
                    </View>

                    <View style={styles.examMetaRow}>
                      <Text style={styles.examMetaLabel}>Equivalent:</Text>
                      <Text style={styles.examMetaValue}>
                        {exam.solid_marks_equivalent}
                      </Text>
                    </View>

                    {exam.exam_question_paper && (
                      <TouchableOpacity
                        style={styles.viewPaperButton}
                        onPress={() =>
                          Linking.openURL(exam.exam_question_paper)
                        }>
                        <Text style={styles.viewPaperButtonText}>
                          View Question Paper
                        </Text>
                      </TouchableOpacity>
                    )}

                    {exam.questions && exam.questions.length > 0 && (
                      <View style={styles.questionsContainer}>
                        <Text style={styles.questionsHeader}>
                          Question-wise Marks:
                        </Text>
                        {exam.questions.map((question, qIndex) => (
                          <View key={`q-${qIndex}`} style={styles.questionRow}>
                            <Text style={styles.questionNumber}>
                              Q{question.q_no}:
                            </Text>
                            <Text style={styles.questionMarks}>
                              {question.obtained_marks !== null
                                ? `${question.obtained_marks}/${question.marks}`
                                : `-/ ${question.marks}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.noExamContainer}>
              <Text style={styles.noExamText}>No exam results available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const CourseCard = ({course, onPress, examResult, onReEnroll}) => {
  const [expanded, setExpanded] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(animatedHeight, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const showReEnroll = course.can_re_enroll === 'Yes';
  const hasExamResults =
    examResult &&
    examResult.exam_results &&
    Object.keys(examResult.exam_results).length > 0;

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(course)}>
        <View style={styles.cardHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{course.course_name}</Text>
            <Text style={styles.courseCode}>{course.course_code}</Text>

            {course.Is === 'Lab' && <Text style={styles.labTag}>Lab</Text>}
          </View>

          <View style={styles.courseDetails}>
            <Text style={styles.detailText}>
              Credits: {course.credit_hours}
            </Text>
            <Text style={styles.detailText}>Type: {course.Type}</Text>
            <Text style={styles.detailText}>Section: {course.section}</Text>
          </View>
        </View>

        <View style={styles.teacherInfo}>
          {course.teacher_image ? (
            <Image
              source={{uri: course.teacher_image}}
              style={styles.teacherImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                {course.teacher_name?.charAt(0) || 'T'}
              </Text>
            </View>
          )}
          <Text style={styles.teacherName}>{course.teacher_name}</Text>
        </View>

        {course.junior_lecturer_name && (
          <View style={styles.teacherInfo}>
            {course.junior_image ? (
              <Image
                source={{uri: course.junior_image}}
                style={styles.teacherImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>
                  {course.junior_lecturer_name?.charAt(0) || 'J'}
                </Text>
              </View>
            )}
            <Text style={styles.teacherName}>
              JL {course.junior_lecturer_name}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {showReEnroll && (
        <TouchableOpacity
          style={styles.reEnrollButton}
          onPress={() => onReEnroll(course)}>
          <Text style={styles.reEnrollButtonText}>Re-enroll</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.examButton}
        onPress={() =>
          hasExamResults ? setShowExamModal(true) : toggleExpand()
        }>
        <Text style={styles.examButtonText}>Exam Results</Text>
        <Text style={styles.examButtonIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.examResultsContainer,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200],
            }),
          },
        ]}>
        {examResult ? (
          <View style={styles.examResultContent}>
            <View style={styles.examRow}>
              <Text style={styles.examLabel}>Total Marks:</Text>
              <Text style={styles.examValue}>{examResult.total_marks}</Text>
            </View>
            <View style={styles.examRow}>
              <Text style={styles.examLabel}>Obtained:</Text>
              <Text style={styles.examValue}>
                {examResult.obtained_marks || 'Not available'}
              </Text>
            </View>
            <View style={styles.examRow}>
              <Text style={styles.examLabel}>Solid Marks:</Text>
              <Text style={styles.examValue}>{examResult.solid_marks}</Text>
            </View>
            <View style={styles.examRow}>
              <Text style={styles.examLabel}>Equivalent:</Text>
              <Text style={styles.examValue}>
                {examResult.solid_marks_equivalent}
              </Text>
            </View>
            {hasExamResults && (
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => setShowExamModal(true)}>
                <Text style={styles.viewDetailsButtonText}>
                  View Detailed Results
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.noExamData}>No exam results available</Text>
        )}
      </Animated.View>

      <ExamResultModal
        visible={showExamModal}
        onClose={() => setShowExamModal(false)}
        examResult={examResult}
      />
    </View>
  );
};

const Courses = ({navigation, route}) => {
  const userData = route.params?.userData || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [courses, setCourses] = useState({
    CurrentCourses: [],
    PreviousCourses: {},
  });
  const [examResults, setExamResults] = useState([]);
  const alertContext = useAlert();

  useEffect(() => {
    fetchData();
  }, []);

  const handleReEnroll = async course => {
    Alert.alert(
      'Re-enroll Confirmation',
      `Re-enroll in ${course.course_name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            if (!course.student_offered_course_id) {
              alertContext.showAlert('error', 'Invalid course ID', 'Error');
              return;
            }

            try {
              const response = await fetch(
                `${API_URL}/api/Insertion/re_enroll/add`,
                {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({
                    student_offered_course_id:
                      course.student_offered_course_id.toString(),
                  }),
                },
              );

              const result = await response.json();

              if (response.ok) {
                alertContext.showAlert('success', 'Re-enrollment successful!');
                fetchCourses();
              } else {
                throw new Error(result.message || 'Re-enrollment failed');
              }
            } catch (error) {
              alertContext.showAlert('error', error.message);
            }
          },
        },
      ],
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCourses(), fetchExamResults()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/Students/getAllEnrollments?student_id=${userData.id}`,
      );
      const data = await response.json();
      console.log(data);
      if (
        data.success === 'Fetcehd Successfully !' ||
        data.status === 'success'
      ) {
        setCourses({
          CurrentCourses: data.CurrentCourses || [],
          PreviousCourses: data.PreviousCourses || {},
        });
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      throw new Error('Failed to fetch courses');
    }
  };

  const fetchExamResults = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/Students/exam-result?student_id=${userData.id}`,
        {
          method: 'POST',
        },
      );
      const data = await response.json();
      if (data.status === 'success') {
        setExamResults(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching exam results:', err);
      setError('Failed to load exam results');
    }
  };

  const handleCourseClick = course => {
    navigation.navigate('CourseContent', {
      student_id: userData.id,
      offered_course_id: course.offered_course_id,
      studentname: userData.name,
      course: course.course_name,
    });
  };

  const getExamResultForCourse = course => {
    if (!examResults || examResults.length === 0) return null;
    return examResults.find(
      result =>
        result.course_name === course.course_name &&
        result.section === course.section,
    );
  };

  const organizePreviousCourses = () => {
    const sections = [];
    if (!courses.PreviousCourses) return sections;

    Object.keys(courses.PreviousCourses).forEach(semester => {
      if (
        Array.isArray(courses.PreviousCourses[semester]) &&
        courses.PreviousCourses[semester].length > 0
      ) {
        sections.push({
          title: semester,
          data: courses.PreviousCourses[semester],
        });
      }
    });

    return sections;
  };

  const renderCurrentCourses = () => {
    return (
      <FlatList
        data={courses.CurrentCourses}
        keyExtractor={(item, index) =>
          `current-${item.offered_course_id || index}`
        }
        renderItem={({item}) => (
          <CourseCard
            course={item}
            onPress={handleCourseClick}
            examResult={getExamResultForCourse(item)}
          />
        )}
        contentContainerStyle={styles.coursesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No current courses found</Text>
          </View>
        }
      />
    );
  };

  const renderPreviousCourses = () => {
    const sections = organizePreviousCourses();

    return (
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `previous-${index}`}
        renderItem={({item}) => (
          <CourseCard
            course={item}
            onPress={handleCourseClick}
            examResult={getExamResultForCourse(item)}
            onReEnroll={handleReEnroll}
          />
        )}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.coursesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No previous courses found</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navbar
        title="Courses"
        userName={userData.name}
        des={'Student'}
        onLogout={() => navigation.replace('Login')}
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'current' && styles.activeTab]}
              onPress={() => setActiveTab('current')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'current' && styles.activeTabText,
                ]}>
                Current Courses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'previous' && styles.activeTab]}
              onPress={() => setActiveTab('previous')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'previous' && styles.activeTabText,
                ]}>
                Previous Courses
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'current'
            ? renderCurrentCourses()
            : renderPreviousCourses()}
        </View>
      )}

      <TouchableOpacity
        style={styles.allCoursesButton}
        onPress={() => navigation.navigate('degreecourses', {userData})}>
        <Text style={styles.allCoursesButtonText}>Show Degree Courses</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary || '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  labTag: {
    backgroundColor: '#f39c12',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  reEnrollButton: {
    backgroundColor: colors.orange || '#ff9800',
    padding: 10,
    alignItems: 'center',
  },
  allCoursesButton: {
    position: 'absolute',
    bottom: 5,
    left: 20,
    right: 20,
    backgroundColor: colors.primary || '#2196f3',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  allCoursesButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reEnrollButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary || '#2196f3',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  activeTabText: {
    color: '#ffffff',
  },
  coursesList: {
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    overflow: 'hidden',
  },
  card: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary || '#2196f3',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#333333',
    opacity: 0.8,
  },
  courseDetails: {
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  teacherImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  placeholderImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary || '#2196f3',
  },
  teacherName: {
    fontSize: 14,
    color: '#333333',
  },
  examButton: {
    backgroundColor: colors.primary || '#2196f3',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  examButtonIcon: {
    color: '#ffffff',
    fontSize: 12,
  },
  examResultsContainer: {
    overflow: 'hidden',
    backgroundColor: '#e3f2fd',
  },
  examResultContent: {
    padding: 15,
  },
  examRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  examLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  examValue: {
    fontSize: 14,
    color: '#333333',
  },
  noExamData: {
    padding: 15,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sectionHeader: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewDetailsButton: {
    backgroundColor: colors.primary || '#2196f3',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    backgroundColor: colors.primary || '#2196f3',
    padding: 15,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 15,
    width: 36,
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  examTypeContainer: {
    marginBottom: 20,
  },
  examTypeHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary || '#2196f3',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  examDetailContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  examMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  examMetaLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555555',
  },
  examMetaValue: {
    fontSize: 15,
    color: '#333333',
  },
  statusDeclared: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  viewPaperButton: {
    backgroundColor: colors.secondary || '#673ab7',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  viewPaperButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  questionsContainer: {
    marginTop: 15,
  },
  questionsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555555',
    marginBottom: 10,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  questionNumber: {
    fontSize: 14,
    color: '#555555',
  },
  questionMarks: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  noExamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noExamText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default Courses;
