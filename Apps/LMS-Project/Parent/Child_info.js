import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {API_URL, Navbar} from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import RNFetchBlob from 'react-native-blob-util';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAlert} from '../ControlsAPI/alert';
import {SelectList} from 'react-native-dropdown-select-list';
import {Modal} from 'react-native-paper';

const Child_info = ({route, navigation}) => {
  const userData = route.params?.parentData || {};
  const parent = userData.parent || {};
  const children = userData.childData || {};
  const alertContext = useAlert();

  const [transcriptData, setTranscriptData] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [examData, setExamData] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState({
    CurrentCourses: [],
    PreviousCourses: {},
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  // Task and exam filters
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'high', 'low'
  const [examSessionFilter, setExamSessionFilter] = useState('all');
  const [examSessions, setExamSessions] = useState([
    {key: 'all', value: 'All Sessions'},
  ]);

  const s_id = children.id;
  const p_id = parent.id;

  useEffect(() => {
    if (s_id && p_id) {
      fetchStudentData();
    }
  }, [s_id, p_id]);

  useEffect(() => {
    // Update exam sessions dropdown when examData changes
    if (examData.length > 0) {
      const uniqueSessions = new Set();

      // First add "All Sessions" option
      const sessions = [{key: 'all', value: 'All Sessions'}];

      // Collect unique sessions from exam data
      examData.forEach(course => {
        if (course.exam_results) {
          // Handle array format
          if (Array.isArray(course.exam_results)) {
            course.exam_results.forEach(exam => {
              if (exam.session && !uniqueSessions.has(exam.session)) {
                uniqueSessions.add(exam.session);
                sessions.push({key: exam.session, value: exam.session});
              }
            });
          }
          // Handle object format (like {Mid: [...], Final: [...]})
          else if (typeof course.exam_results === 'object') {
            Object.values(course.exam_results).forEach(examGroup => {
              const examsArray = Array.isArray(examGroup)
                ? examGroup
                : [examGroup];
              examsArray.forEach(exam => {
                if (exam.session && !uniqueSessions.has(exam.session)) {
                  uniqueSessions.add(exam.session);
                  sessions.push({key: exam.session, value: exam.session});
                }
              });
            });
          }
        }
      });

      setExamSessions(sessions);
    }
  }, [examData]);

  const handleDownloadTranscript = async () => {
    try {
      const downloadsPath = RNFetchBlob.fs.dirs.DownloadDir;
      const fileName = `Transcript_${s_id}_${Date.now()}.pdf`;
      const filePath = `${downloadsPath}/${fileName}`;

      alertContext.showAlert(
        'info',
        'Starting download...',
        'Transcript',
        3000,
      );

      const downloadTask = RNFetchBlob.config({
        fileCache: false,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: `Transcript ${s_id}`,
          description: 'Downloading transcript...',
          path: filePath,
          mime: 'application/pdf',
          mediaScannable: true,
          visible: true,
        },
      }).fetch(
        'GET',
        `${API_URL}/api/Students/TranscriptPDF?student_id=${s_id}`,
        {'Content-Type': 'application/pdf'},
      );

      const res = await downloadTask;
      alertContext.showAlert(
        'success',
        'Transcript downloaded successfully',
        'Download Complete',
        3000,
      );
    } catch (error) {
      console.error('Download failed:', error);
      alertContext.showAlert(
        'error',
        'Download failed',
        'Download Error',
        3000,
      );
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Enhanced helper function for API calls
      const fetchAPI = async (url, options = {}) => {
        const defaultHeaders = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        const response = await fetch(url, {
          ...options,
          headers: {
            ...defaultHeaders,
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `API request failed with status ${response.status}`,
          );
        }

        return await response.json();
      };

      // Prepare common request data
      const requestParams = {student_id: s_id, parent_id: p_id};
      const postOptions = {
        method: 'POST',
        body: JSON.stringify(requestParams),
      };

      // Fetch all data in parallel with proper error handling for each request
      const [
        transcriptRes,
        timetableRes,
        taskRes,
        attendanceRes,
        examRes,
        enrollmentRes,
      ] = await Promise.all([
        // GET requests
        fetchAPI(`${API_URL}/api/Students/Transcript?student_id=${s_id}`).catch(
          e => ({error: 'Transcript', message: e.message}),
        ),

        fetchAPI(
          `${API_URL}/api/Students/FullTimetable?student_id=${s_id}`,
        ).catch(e => ({error: 'Timetable', message: e.message})),

        fetchAPI(
          `${API_URL}/api/Students/Parents/task/evaluated?student_id=${s_id}&parent_id=${p_id}`,
        ).catch(e => ({error: 'Tasks', message: e.message})),

        fetchAPI(
          `${API_URL}/api/Students/Parents/attendance?student_id=${s_id}&parent_id=${p_id}`,
        ).catch(e => ({error: 'Attendance', message: e.message})),

        // POST request for exam results
        fetchAPI(
          `${API_URL}/api/Students/Parents/exam-result`,
          postOptions,
        ).catch(e => ({error: 'Exams', message: e.message})),

        // GET request for enrollments
        fetchAPI(
          `${API_URL}/api/Students/Parents/getAllEnrollments?student_id=${s_id}&parent_id=${p_id}`,
        ).catch(e => ({error: 'Enrollments', message: e.message})),
      ]);

      // Handle individual API errors
      const apiErrors = [
        transcriptRes,
        timetableRes,
        taskRes,
        attendanceRes,
        examRes,
        enrollmentRes,
      ].filter(res => res.error);

      if (apiErrors.length > 0) {
        console.warn('Partial data load - some APIs failed:', apiErrors);
      }

      console.log('Transcript Response:', transcriptRes);
      console.log('Timetable Response:', timetableRes);
      console.log('Task Response:', taskRes);
      console.log('Attendance Response:', attendanceRes);
      console.log('Exam Response:', examRes);
      console.log('Enrollment Response:', enrollmentRes);

      setTranscriptData(transcriptRes.error ? [] : transcriptRes || []);
      setTimetableData(timetableRes.error ? [] : timetableRes.data || []);
      setTaskData(taskRes.error ? [] : taskRes.data || []);
      setAttendanceData(attendanceRes.error ? [] : attendanceRes.data || []);
      setExamData(examRes.error ? [] : examRes.data || []);
      setEnrollmentData({
        CurrentCourses: enrollmentRes.error
          ? []
          : enrollmentRes.CurrentCourses || [],
        PreviousCourses: enrollmentRes.error
          ? {}
          : enrollmentRes.PreviousCourses || {},
      });
    } catch (error) {
      console.error('Error in fetchStudentData:', error);
      Alert.alert('Error', error.message || 'Failed to fetch student data', [
        {text: 'Retry', onPress: fetchStudentData},
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examData.length > 0) {
      const uniqueSessions = new Set();
      const sessions = [{key: 'all', value: 'All Sessions'}];

      examData.forEach(course => {
        // Add the course's session if it exists
        if (course.session && !uniqueSessions.has(course.session)) {
          uniqueSessions.add(course.session);
          sessions.push({key: course.session, value: course.session});
        }

        // Also check exam_results for sessions
        if (course.exam_results) {
          if (Array.isArray(course.exam_results)) {
            course.exam_results.forEach(exam => {
              if (exam.session && !uniqueSessions.has(exam.session)) {
                uniqueSessions.add(exam.session);
                sessions.push({key: exam.session, value: exam.session});
              }
            });
          } else if (typeof course.exam_results === 'object') {
            Object.values(course.exam_results).forEach(examGroup => {
              const exams = Array.isArray(examGroup) ? examGroup : [examGroup];
              exams.forEach(exam => {
                if (exam.session && !uniqueSessions.has(exam.session)) {
                  uniqueSessions.add(exam.session);
                  sessions.push({key: exam.session, value: exam.session});
                }
              });
            });
          }
        }
      });

      setExamSessions(sessions);
    }
  }, [examData]);
  // In Child_info.js
  const renderTabButton = (tabName, title, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && styles.activeTabButton,
      ]}
      onPress={() => {
        if (tabName === 'tasks') {
          // Navigate to ParentTask with necessary data
          navigation.navigate('parenttask', {
            userData: {
              parentData: userData.parent,
              taskData: taskData,
            },
            taskFilter,
            setTaskFilter,
          });
        } else {
          setActiveTab(tabName);
        }
      }}>
      <MaterialIcons
        name={icon}
        size={17}
        color={activeTab === tabName ? colors.primary : colors.gray}
      />
      <Text
        style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Remove the entire renderTasks function from Child_info.js

  const filterExams = () => {
    if (!examData || examData.length === 0) return [];

    if (examSessionFilter === 'all') {
      return examData;
    }

    return examData
      .filter(course => {
        // First check if the course session matches
        if (course.session === examSessionFilter) {
          return true;
        }

        // Then check exam_results for matching sessions
        if (course.exam_results) {
          // Handle array format
          if (Array.isArray(course.exam_results)) {
            return course.exam_results.some(
              exam => exam.session === examSessionFilter,
            );
          }
          // Handle object format
          else if (typeof course.exam_results === 'object') {
            return Object.values(course.exam_results).some(examGroup => {
              const exams = Array.isArray(examGroup) ? examGroup : [examGroup];
              return exams.some(exam => exam.session === examSessionFilter);
            });
          }
        }

        return false;
      })
      .map(course => {
        // If the course session matches, return as is
        if (course.session === examSessionFilter) {
          return course;
        }

        // Otherwise filter exam_results to only include matching sessions
        if (course.exam_results) {
          // Handle array format
          if (Array.isArray(course.exam_results)) {
            return {
              ...course,
              exam_results: course.exam_results.filter(
                exam => exam.session === examSessionFilter,
              ),
            };
          }
          // Handle object format
          else if (typeof course.exam_results === 'object') {
            const filteredExamResults = {};

            Object.entries(course.exam_results).forEach(
              ([examType, examGroup]) => {
                const exams = Array.isArray(examGroup)
                  ? examGroup
                  : [examGroup];
                const matchingExams = exams.filter(
                  exam => exam.session === examSessionFilter,
                );

                if (matchingExams.length > 0) {
                  filteredExamResults[examType] =
                    matchingExams.length === 1
                      ? matchingExams[0]
                      : matchingExams;
                }
              },
            );

            if (Object.keys(filteredExamResults).length > 0) {
              return {
                ...course,
                exam_results: filteredExamResults,
              };
            }
          }
        }

        return course;
      });
  };

  const renderExams = () => {
    const filteredExams = filterExams();

    return (
      <View style={styles.contentContainer}>
        {/* Session Filter Dropdown */}
        <View style={styles.filterContainer}>
          <Text style={[styles.filterLabel, {color: colors.black}]}>
            Filter by Session:
          </Text>
          <View style={styles.selectListContainer}>
            <SelectList
              setSelected={val => setExamSessionFilter(val)}
              data={examSessions}
              save="key"
              defaultOption={{key: 'all', value: 'All Sessions'}}
              search={false}
              boxStyles={[styles.selectListBox, {borderColor: colors.primary}]}
              inputStyles={[styles.selectListInput, {color: colors.black}]}
              dropdownStyles={[
                styles.selectListDropdown,
                {borderColor: colors.primary},
              ]}
              dropdownItemStyles={[
                styles.selectListItem,
                {backgroundColor: colors.white},
              ]}
              dropdownTextStyles={[
                styles.selectListText,
                {color: colors.black},
              ]}
            />
          </View>
        </View>

        {filteredExams.length > 0 ? ( // Changed from examData to filteredExams
          filteredExams.map(
            (
              course,
              index, // Changed from examData to filteredExams
            ) => (
              <View
                key={index}
                style={[styles.examCard, {backgroundColor: colors.white}]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons
                    name="class"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.cardTitle, {color: colors.black}]}>
                    {course.course_name} ({course.section})
                  </Text>
                  <Text
                    style={[
                      styles.examSummaryText,
                      {
                        color: colors.white,
                        fontSize: 9,
                        backgroundColor: colors.primary,
                        padding: 5,
                        borderRadius: 10,
                        fontWeight: 'bold',
                      },
                    ]}>
                    {course.session || 'N/A'}
                  </Text>
                </View>

                {course.exam_results && (
                  <View>
                    {/* For array format */}
                    {Array.isArray(course.exam_results) &&
                    course.exam_results.length > 0 ? (
                      <View>
                        <View style={styles.examSummary}>
                          <Text
                            style={[
                              styles.examSummaryText,
                              {color: colors.black},
                            ]}>
                            Session: {course.session || 'N/A'}
                          </Text>
                          <Text
                            style={[
                              styles.examSummaryText,
                              {color: colors.black},
                            ]}>
                            Total Marks: {course.total_marks || '0'}
                          </Text>
                          <Text
                            style={[
                              styles.examSummaryText,
                              {color: colors.black},
                            ]}>
                            Obtained Marks: {course.obtained_marks || '0'}
                          </Text>
                          <Text
                            style={[
                              styles.examSummaryText,
                              {color: colors.black},
                            ]}>
                            Solid Marks: {course.solid_marks || '0'}
                          </Text>
                        </View>

                        {course.exam_results.map((exam, examIndex) => (
                          <View key={examIndex} style={styles.examItem}>
                            <Text
                              style={[
                                styles.examTypeHeader,
                                {color: colors.black},
                              ]}>
                              {exam.exam_type || 'Exam'}
                            </Text>
                            <Text
                              style={[styles.examMarks, {color: colors.black}]}>
                              Marks: {exam.obtained_marks || '0'} /{' '}
                              {exam.total_marks}
                            </Text>
                            {exam.exam_question_paper && (
                              <TouchableOpacity
                                style={styles.viewPaperButton}
                                onPress={() =>
                                  Linking.openURL(exam.exam_question_paper)
                                }>
                                <Text style={styles.viewPaperText}>
                                  View Question Paper
                                </Text>
                              </TouchableOpacity>
                            )}
                            {exam.questions && (
                              <View style={styles.questionsContainer}>
                                <Text
                                  style={[
                                    styles.questionsTitle,
                                    {color: colors.black},
                                  ]}>
                                  Questions:
                                </Text>
                                {exam.questions.map((q, qIndex) => (
                                  <View
                                    key={qIndex}
                                    style={styles.questionItem}>
                                    <Text
                                      style={[
                                        styles.questionText,
                                        {color: colors.black},
                                      ]}>
                                      Q{q.q_no}: {q.marks} marks
                                    </Text>
                                    <Text
                                      style={[
                                        styles.questionText,
                                        {color: colors.black},
                                      ]}>
                                      Obtained: {q.obtained_marks || '0'}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {/* For object format */}
                    {!Array.isArray(course.exam_results) &&
                      Object.keys(course.exam_results).length > 0 && (
                        <View>
                          <View style={styles.examSummary}>
                            <Text
                              style={[
                                styles.examSummaryText,
                                {color: colors.black},
                              ]}>
                              Session: {course.session || 'N/A'}
                            </Text>
                            <Text
                              style={[
                                styles.examSummaryText,
                                {color: colors.black},
                              ]}>
                              Total Marks: {course.total_marks || '0'}
                            </Text>
                            <Text
                              style={[
                                styles.examSummaryText,
                                {color: colors.black},
                              ]}>
                              Obtained Marks: {course.obtained_marks || '0'}
                            </Text>
                            <Text
                              style={[
                                styles.examSummaryText,
                                {color: colors.black},
                              ]}>
                              Solid Marks: {course.solid_marks || '0'}
                            </Text>
                          </View>

                          {Object.entries(course.exam_results).map(
                            ([examType, exams], examTypeIndex) => {
                              const examArray = Array.isArray(exams)
                                ? exams
                                : [exams];
                              return examArray.map((exam, examIndex) => (
                                <View
                                  key={`${examTypeIndex}-${examIndex}`}
                                  style={styles.examItem}>
                                  <Text
                                    style={[
                                      styles.examTypeHeader,
                                      {color: colors.black},
                                    ]}>
                                    {examType}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.examMarks,
                                      {color: colors.black},
                                    ]}>
                                    Marks: {exam.obtained_marks || '0'} /{' '}
                                    {exam.total_marks}
                                  </Text>
                                  {exam.exam_question_paper && (
                                    <TouchableOpacity
                                      style={styles.viewPaperButton}
                                      onPress={() =>
                                        Linking.openURL(
                                          exam.exam_question_paper,
                                        )
                                      }>
                                      <Text style={styles.viewPaperText}>
                                        View Question Paper
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                  {exam.questions && (
                                    <View style={styles.questionsContainer}>
                                      <Text
                                        style={[
                                          styles.questionsTitle,
                                          {color: colors.black},
                                        ]}>
                                        Questions:
                                      </Text>
                                      {exam.questions.map((q, qIndex) => (
                                        <View
                                          key={qIndex}
                                          style={styles.questionItem}>
                                          <Text
                                            style={[
                                              styles.questionText,
                                              {color: colors.black},
                                            ]}>
                                            Q{q.q_no}: {q.marks} marks
                                          </Text>
                                          <Text
                                            style={[
                                              styles.questionText,
                                              {color: colors.black},
                                            ]}>
                                            Obtained: {q.obtained_marks || '0'}
                                          </Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}
                                </View>
                              ));
                            },
                          )}
                        </View>
                      )}
                  </View>
                )}

                {(!course.exam_results ||
                  (Array.isArray(course.exam_results) &&
                    course.exam_results.length === 0) ||
                  (!Array.isArray(course.exam_results) &&
                    Object.keys(course.exam_results).length === 0)) && (
                  <Text style={[styles.noExamsText, {color: colors.black}]}>
                    No exam details available for this course
                  </Text>
                )}
              </View>
            ),
          )
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="quiz" size={48} color={colors.gray} />
            <Text style={[styles.emptyText, {color: colors.black}]}>
              {examSessionFilter === 'all'
                ? 'No exam data available'
                : `No exams found for ${examSessionFilter}`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderStudentInfo = () => (
    <View style={styles.contentContainer}>
      {/* Student Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image
            source={{uri: children.image}}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>{children.name}</Text>
            <Text style={styles.studentRegNo}>Reg: {children.regno}</Text>
            <Text style={styles.studentSection}>
              Section: {children.section}
            </Text>
            <View style={styles.statusBadge}>
              <MaterialIcons name="verified" size={16} color={colors.success} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Parent Information Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="family-restroom"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>Parent Information</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color={colors.primary} />
          <Text style={styles.infoLabel}>Parent Name:</Text>
          <Text style={styles.infoValue}>{parent.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={20} color={colors.primary} />
          <Text style={styles.infoLabel}>Contact:</Text>
          <Text style={styles.infoValue}>{parent.contact || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={20} color={colors.primary} />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{parent.email || 'N/A'}</Text>
        </View>
      </View>

      {/* Academic Overview Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="school" size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Academic Overview</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <MaterialIcons name="grade" size={24} color={colors.success} />
            <Text style={styles.statValue}>
              {transcriptData.length > 0
                ? (
                    transcriptData.reduce(
                      (sum, sem) => sum + parseFloat(sem.GPA),
                      0,
                    ) / transcriptData.length
                  ).toFixed(2)
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>CGPA</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons
              name="event-available"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.statValue}>
              {attendanceData.length > 0
                ? Math.round(
                    attendanceData.reduce(
                      (sum, course) => sum + course.Percentage,
                      0,
                    ) / attendanceData.length,
                  ) + '%'
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Avg Attendance</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="book" size={24} color={colors.warning} />
            <Text style={styles.statValue}>
              {enrollmentData.CurrentCourses.length}
            </Text>
            <Text style={styles.statLabel}>Current Courses</Text>
          </View>
        </View>
      </View>

      {/* Current Courses Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="class" size={24} color={colors.primary} />
          <Text style={styles.cardTitle}>Current Courses</Text>
        </View>
        {enrollmentData.CurrentCourses.length > 0 ? (
          enrollmentData.CurrentCourses.map((course, index) => (
            <View key={index} style={styles.courseItem}>
              <Text style={styles.courseName}>
                {course.course_name} ({course.course_code})
              </Text>
              <Text style={styles.courseTeacher}>
                Teacher: {course.teacher_name}
              </Text>
              {/* {course.remarks && (
                <Text style={styles.courseRemarks}>
                  Remarks: {course.remarks}
                </Text>
              )} */}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No current courses</Text>
        )}
      </View>
    </View>
  );

  const renderTranscript = () => (
    <View style={styles.contentContainer}>
      {transcriptData.length > 0 ? (
        transcriptData.map((semester, index) => (
          <View key={index} style={styles.transcriptCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="assessment"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>{semester.session_name}</Text>
              <View style={styles.gpaContainer}>
                <Text style={styles.gpaText}>GPA: {semester.GPA || 'N/A'}</Text>
              </View>
            </View>

            {semester.subjects?.map((subject, subIndex) => (
              <View key={subIndex} style={styles.courseRow}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{subject.course_name}</Text>
                  <Text style={styles.courseCode}>{subject.course_code}</Text>
                </View>
                <View style={styles.gradeInfo}>
                  <Text
                    style={[
                      styles.gradeText,
                      {
                        color:
                          subject.grade === 'F'
                            ? 'red'
                            : subject.grade === 'A'
                            ? 'orange'
                            : colors.green,
                      },
                    ]}>
                    {subject.grade}
                  </Text>
                  <Text style={styles.creditText}>
                    {subject.credit_hours} CH
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="description" size={48} color={colors.gray} />
          <Text style={styles.emptyText}>No transcript data available</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadTranscript}>
        <Icon name="file-download" size={20} color="white" />
        <Text style={styles.downloadButtonText}>Download Transcript</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTimetable = () => (
    <View style={styles.contentContainer}>
      {timetableData.length > 0 ? (
        timetableData.map((dayData, index) => (
          <View key={index} style={styles.timetableCard}>
            <View style={styles.dayHeader}>
              <MaterialIcons name="today" size={24} color={colors.primary} />
              <Text style={styles.dayTitle}>{dayData.day}</Text>
            </View>

            {dayData.schedule?.map((classItem, classIndex) => (
              <View key={classIndex} style={styles.classRow}>
                <View style={styles.timeContainer}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.timeText}>
                    {classItem.start_time} - {classItem.end_time}
                  </Text>
                </View>

                <View style={styles.classDetails}>
                  <Text style={styles.subjectName}>{classItem.coursename}</Text>
                  <Text style={styles.teacherName}>
                    {classItem.teachername}
                    {classItem.juniorlecturername &&
                      classItem.juniorlecturername !== 'N/A' &&
                      ` & ${classItem.juniorlecturername}`}
                  </Text>
                  <View style={styles.classMeta}>
                    <MaterialIcons
                      name="location-on"
                      size={14}
                      color={colors.gray}
                    />
                    <Text style={styles.venueText}>{classItem.venue}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="schedule" size={48} color={colors.gray} />
          <Text style={styles.emptyText}>No timetable data available</Text>
        </View>
      )}
    </View>
  );

  const renderAttendance = () => (
    <View style={styles.contentContainer}>
      {attendanceData.length > 0 ? (
        attendanceData.map((subject, index) => (
          <View key={index} style={styles.attendanceCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="event-available"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>{subject.course_name}</Text>
              <View
                style={[
                  styles.percentageBadge,
                  {
                    backgroundColor:
                      subject.Percentage >= 75
                        ? colors.success
                        : subject.Percentage >= 60
                        ? colors.warning
                        : colors.red1,
                  },
                ]}>
                <Text style={styles.percentageText}>{subject.Percentage}%</Text>
              </View>
            </View>

            <Text style={styles.courseDetails}>
              {subject.course_code} • {subject.section_name}
            </Text>

            <Text style={styles.teacherText}>
              Instructor: {subject.teacher_name}
              {subject.junior_lec_name !== 'N/A' &&
                ` & ${subject.junior_lec_name}`}
            </Text>

            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {subject.Total_classes_conducted}
                </Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.success}]}>
                  {subject.total_present}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.red1}]}>
                  {subject.total_absent}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-available" size={48} color={colors.gray} />
          <Text style={styles.emptyText}>No attendance data available</Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return renderStudentInfo();
      case 'transcript':
        return renderTranscript();
      case 'timetable':
        return renderTimetable();
      case 'attendance':
        return renderAttendance();
      case 'tasks':
        return renderTasks();
      case 'exams':
        return renderExams();
      default:
        return renderStudentInfo();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading student data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Student Tasks"
        userName={userData?.parent?.name}
        des="Parent"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabContainer}>
        {renderTabButton('info', 'Overview', 'info')}
        {renderTabButton('transcript', 'Transcript', 'assessment')}
        {renderTabButton('timetable', 'Timetable', 'schedule')}
        {renderTabButton('attendance', 'Attendance', 'event-available')}
        {renderTabButton('tasks', 'Tasks', 'assignment')}
        {renderTabButton('exams', 'Exams', 'quiz')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,

    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Scroll View
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },

  contentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },

  profileInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 3,
  },

  studentRegNo: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },

  studentSection: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 3,
  },

  // Info Cards
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 10,
    flex: 1,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 6,
    minWidth: 70,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 3,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 3,
  },

  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Course Items
  courseItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },

  courseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 3,
  },

  courseCode: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 3,
  },

  courseTeacher: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 3,
  },

  courseRemarks: {
    fontSize: 13,
    color: colors.orange,
    fontStyle: 'italic',
  },

  // Transcript Cards
  transcriptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  gpaContainer: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },

  gpaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d4ed8',
  },

  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  courseInfo: {
    flex: 1,
  },

  gradeInfo: {
    alignItems: 'center',
    minWidth: 50,
  },

  gradeText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },

  creditText: {
    fontSize: 11,
    color: '#64748b',
  },

  // Timetable Cards
  timetableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },

  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 10,
  },

  classRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 90,
  },

  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    marginLeft: 3,
  },

  classDetails: {
    flex: 1,
  },

  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 3,
  },

  teacherName: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 3,
  },

  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  venueText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 3,
  },

  // Attendance Cards
  attendanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  percentageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },

  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  courseDetails: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },

  teacherText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },

  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 3,
  },

  // Exam Cards
  examCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  examSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  examSummaryText: {
    fontSize: 13,
    marginBottom: 3,
    fontWeight: '500',
  },

  examItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },

  examTypeHeader: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },

  examMarks: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },

  viewPaperButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  viewPaperText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },

  questionsContainer: {
    marginTop: 8,
  },

  questionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },

  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },

  questionText: {
    fontSize: 11,
  },

  noExamsText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Filter Styles
  filterContainer: {
    marginBottom: 16,
  },

  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },

  selectListContainer: {
    marginBottom: 12,
  },

  selectListBox: {
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  selectListInput: {
    fontSize: 13,
    fontWeight: '500',
  },

  selectListDropdown: {
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    marginTop: 3,
  },

  selectListItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  selectListText: {
    fontSize: 13,
  },

  // Download Button
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Bottom Tab Navigation
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 15,

    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',

    padding: 3,
    borderRadius: 8,
    marginHorizontal: 1,
    backgroundColor: 'transparent',
  },

  activeTabButton: {
    backgroundColor: '#dbeafe',
  },

  tabText: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
  },

  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },

  // Empty States
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },

  // Utility
  bottomSpacer: {
    height: 16,
  },
});

export default Child_info;
