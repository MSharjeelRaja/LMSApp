import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import {API_URL, Navbar} from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';

const SectionDetails = ({route, navigation}) => {
  const {courseId, userData} = route.params;
  const [sectionData, setSectionData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  const [remarksModalVisible, setRemarksModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [remarksText, setRemarksText] = useState('');
  const [isUpdatingRemarks, setIsUpdatingRemarks] = useState(false);
  console.log('COURSE ID :' + courseId);
  useEffect(() => {
    fetchSectionDetails();
  }, []);
  const handleAddRemarks = student => {
    setCurrentStudent(student);
    setRemarksText(student.remarks || '');
    setIsUpdatingRemarks(!!student.remarks);
    setRemarksModalVisible(true);
  };

  const handleSaveRemarks = async () => {
    if (!remarksText.trim() || !currentStudent) return;

    try {
      const response = await fetch(
        `${API_URL}/api/Teachers/remarks/add_or_update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_offered_course_id: courseId,
            student_id: currentStudent.student_id,
            remarks: remarksText.trim(),
          }),
        },
      );

      const data = await response.json();
      if (data.status === 'success') {
        Alert.alert('Success', data.message);
        fetchSectionDetails(); // Refresh data
        setRemarksModalVisible(false);
      } else {
        throw new Error(data.message || 'Failed to save remarks');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteRemarks = async () => {
    if (!currentStudent) return;

    try {
      const response = await fetch(`${API_URL}/api/Teachers/remarks/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_offered_course_id: courseId,
          student_id: currentStudent.student_id,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        Alert.alert('Success', data.message);
        fetchSectionDetails(); // Refresh data
        setRemarksModalVisible(false);
      } else {
        throw new Error(data.message || 'Failed to delete remarks');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  const fetchSectionDetails = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/Teachers/section/details/${courseId}`,
      );
      const data = await response.json();
      console.log(data);
      if (data.success) {
        setSectionData(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch section details');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents =
    sectionData?.students?.filter(
      student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.RegNo.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const toggleExpanded = (studentId, section) => {
    const key = `${studentId}_${section}`;
    setExpandedCards(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getInitials = name => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getPerformanceColor = percentage => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#FF5722';
    return '#F44336';
  };

  const renderPerformanceCard = (title, percentage, icon, color) => (
    <View style={[styles.performanceCard, {backgroundColor: color + '15'}]}>
      <Text style={[styles.performanceIcon, {color}]}>{icon}</Text>
      <Text style={[styles.performancePercentage, {color}]}>
        {percentage?.toFixed(0) || 0}%
      </Text>
      <Text style={styles.performanceTitle}>{title}</Text>
    </View>
  );

  const renderExpandableSection = (
    student,
    sectionKey,
    title,
    icon,
    content,
  ) => {
    const key = `${student.student_id}_${sectionKey}`;
    const isExpanded = expandedCards[key];

    return (
      <TouchableOpacity
        style={styles.expandableSection}
        onPress={() => toggleExpanded(student.student_id, sectionKey)}>
        <View style={styles.expandableHeader}>
          <View style={styles.expandableHeaderLeft}>
            <Text style={styles.expandableIcon}>{icon}</Text>
            <Text style={styles.expandableTitle}>{title}</Text>
          </View>
          <Text
            style={[
              styles.expandableArrow,
              {transform: [{rotate: isExpanded ? '180deg' : '0deg'}]},
            ]}>
            ▼
          </Text>
        </View>
        {isExpanded && <View style={styles.expandableContent}>{content}</View>}
      </TouchableOpacity>
    );
  };

  const renderBasicInfo = student => (
    <View style={styles.infoContent}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Registration No:</Text>
        <Text style={styles.infoValue}>{student.RegNo}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>CGPA:</Text>
        <Text style={styles.infoValue}>{student.CGPA}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Gender:</Text>
        <Text style={styles.infoValue}>{student.Gender}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Guardian:</Text>
        <Text style={styles.infoValue}>{student.Guardian}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Intake:</Text>
        <Text style={styles.infoValue}>{student.InTake}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Program:</Text>
        <Text style={styles.infoValue}>{student.Program}</Text>
      </View>
      {student.email && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{student.email}</Text>
        </View>
      )}
    </View>
  );

  const renderAttendanceDetails = student => (
    <View style={styles.infoContent}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Classes:</Text>
        <Text style={styles.infoValue}>
          {student.attendance.total_classes_conducted}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Present:</Text>
        <Text style={[styles.infoValue, {color: '#4CAF50'}]}>
          {student.attendance.total_present}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Absent:</Text>
        <Text style={[styles.infoValue, {color: '#F44336'}]}>
          {student.attendance.total_absent}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Percentage:</Text>
        <Text
          style={[
            styles.infoValue,
            {color: getPerformanceColor(student.attendance.percentage)},
          ]}>
          {student.attendance.percentage.toFixed(2)}%
        </Text>
      </View>
    </View>
  );

  const renderTaskPerformance = student => (
    <View style={styles.infoContent}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Tasks:</Text>
        <Text style={styles.infoValue}>
          {student.task.total_tasks_conducted}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Points:</Text>
        <Text style={styles.infoValue}>{student.task.total_points}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Marks Obtained:</Text>
        <Text style={styles.infoValue}>
          {student.task.total_marks_obtained}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Percentage:</Text>
        <Text
          style={[
            styles.infoValue,
            {color: getPerformanceColor(student.task.percentage)},
          ]}>
          {student.task.percentage.toFixed(2)}%
        </Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.subSectionTitle}>With Consideration Policy:</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Marks:</Text>
        <Text style={styles.infoValue}>
          {student.task.total_marks_by_consideration_policy}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Obtained:</Text>
        <Text style={styles.infoValue}>
          {student.task.total_obtained_by_consideration}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Percentage:</Text>
        <Text
          style={[
            styles.infoValue,
            {
              color: getPerformanceColor(
                student.task.percentage_by_consideration,
              ),
            },
          ]}>
          {student.task.percentage_by_consideration.toFixed(2)}%
        </Text>
      </View>
    </View>
  );

  const renderExamResults = student => (
    <View style={styles.infoContent}>
      <Text style={styles.subSectionTitle}>Mid Exam:</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Solid Marks:</Text>
        <Text style={styles.infoValue}>{student.Mid_Exam.solid_marks}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Equivalent:</Text>
        <Text style={styles.infoValue}>
          {student.Mid_Exam.solid_equivalent}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Percentage:</Text>
        <Text
          style={[
            styles.infoValue,
            {color: getPerformanceColor(student.Mid_Exam.percentage)},
          ]}>
          {student.Mid_Exam.percentage.toFixed(2)}%
        </Text>
      </View>

      {student.Final_Exam ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.subSectionTitle}>Final Exam:</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Solid Marks:</Text>
            <Text style={styles.infoValue}>
              {student.Final_Exam.solid_marks}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Equivalent:</Text>
            <Text style={styles.infoValue}>
              {student.Final_Exam.solid_equivalent}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Percentage:</Text>
            <Text
              style={[
                styles.infoValue,
                {color: getPerformanceColor(student.Final_Exam.percentage)},
              ]}>
              {student.Final_Exam.percentage.toFixed(2)}%
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.divider} />
          <Text style={styles.subSectionTitle}>Final Exam:</Text>
          <Text style={styles.noDataText}>Not conducted yet</Text>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Section Details"
          userName={userData.name}
          des="Teacher"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          onLogout={() => navigation.replace('Login')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B9BD5" />
          <Text style={styles.loadingText}>Loading section details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Section Details"
        userName={userData.name}
        des="Teacher"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <View style={styles.courseIconContainer}>
            <Text style={styles.courseIcon}>🎓</Text>
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>
              {sectionData?.['Course Name']}
            </Text>
            <Text style={styles.courseDetails}>
              {sectionData?.['Section Name']} • {sectionData?.['Session Name']}
            </Text>
          </View>
          <View style={styles.studentCount}>
            <Text style={styles.studentCountIcon}>👥</Text>
            <Text style={styles.studentCountText}>
              Total Students: {sectionData?.students_count}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search students by name or registration number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Students List */}
        {filteredStudents.map((student, index) => (
          <View key={student.student_id} style={styles.studentCard}>
            {/* Student Header */}
            <View style={styles.studentHeader}>
              <View style={styles.avatarContainer}>
                {student.Image ? (
                  <Image source={{uri: student.Image}} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {getInitials(student.name)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentRegNo}>{student.RegNo}</Text>
                <Text style={styles.studentCGPA}>CGPA: {student.CGPA}</Text>
              </View>
              {/* <TouchableOpacity
  style={styles.remarksButton}
  onPress={() => handleAddRemarks(student)}
>
  <Text style={styles.remarksButtonText}>
    {student.remarks ? 'Update Remarks' : 'Add Remarks'}
  </Text>
</TouchableOpacity> */}
            </View>

            {/* {student.remarks && (
  <View style={styles.remarksContainer}>
    <Text style={styles.remarksLabel}>Remarks:</Text>
    <Text style={styles.remarksText}>{student.remarks}</Text>
  </View>
)} */}
            <View style={styles.performanceContainer}>
              {renderPerformanceCard(
                'Attendance',
                student.attendance.percentage,
                '📅',
                getPerformanceColor(student.attendance.percentage),
              )}
              {renderPerformanceCard(
                'Tasks',
                student.task.percentage_by_consideration,
                '✅',
                getPerformanceColor(student.task.percentage_by_consideration),
              )}
              {renderPerformanceCard(
                'Mid Exam',
                student.Mid_Exam.percentage,
                '📊',
                getPerformanceColor(student.Mid_Exam.percentage),
              )}
            </View>

            {/* Expandable Sections */}
            {renderExpandableSection(
              student,
              'basic',
              'Basic Information',
              'ℹ️',
              renderBasicInfo(student),
            )}

            {renderExpandableSection(
              student,
              'attendance',
              'Attendance Details',
              '📅',
              renderAttendanceDetails(student),
            )}

            {renderExpandableSection(
              student,
              'tasks',
              'Task Performance',
              '✅',
              renderTaskPerformance(student),
            )}

            {renderExpandableSection(
              student,
              'exams',
              'Exam Results',
              '📊',
              renderExamResults(student),
            )}
          </View>
        ))}

        {filteredStudents.length === 0 && !loading && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No students found</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your search criteria
            </Text>
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={remarksModalVisible}
        onRequestClose={() => setRemarksModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setRemarksModalVisible(false)}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isUpdatingRemarks ? 'Update Remarks' : 'Add Remarks'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {currentStudent?.name} ({currentStudent?.RegNo})
              </Text>
            </View>

            <TextInput
              style={styles.remarksInput}
              multiline
              placeholder="Enter your remarks about this student..."
              placeholderTextColor="#999"
              value={remarksText}
              onChangeText={setRemarksText}
              autoFocus={true}
            />

            <View style={styles.charCountContainer}>
              <Text style={styles.charCountText}>
                {remarksText.length}/500 characters
              </Text>
            </View>

            <View style={styles.modalFooter}>
              {isUpdatingRemarks && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteRemarks}>
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRemarksModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  !remarksText.trim() && styles.disabledButton,
                ]}
                onPress={handleSaveRemarks}
                disabled={!remarksText.trim()}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  courseHeader: {
    backgroundColor: '#5B9BD5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bremarksContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',

    orderRadius: 5,
  },
  remarksLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },

  courseIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  courseIcon: {
    fontSize: 32,
    color: 'white',
  },
  courseInfo: {
    marginBottom: 16,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  studentCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  studentCountIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  studentCountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#5B9BD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  studentRegNo: {
    fontSize: 14,
    color: '#5B9BD5',
    marginBottom: 2,
  },
  studentCGPA: {
    fontSize: 14,
    color: '#666',
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  performanceCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  performanceIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  performancePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performanceTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  expandableSection: {
    marginBottom: 8,
  },
  expandableHeader: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandableIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expandableArrow: {
    fontSize: 12,
    color: '#666',
  },
  expandableContent: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 5,
  },
  charCountText: {
    fontSize: 12,
    color: '#999',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#5B9BD5',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },

  remarksButton: {
    backgroundColor: '#5B9BD5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'flex-start',

    elevation: 2,
  },
  remarksButtonText: {
    color: 'white',
    fontSize: 10,
  },
  remarksContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#5B9BD5',
  },
  remarksLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
    fontSize: 14,
  },
  remarksText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000', // Changed to black
  },
});

export default SectionDetails;
