import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import RNFetchBlob from 'react-native-blob-util'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useAlert } from '../ControlsAPI/alert';
const Child_info = ({ route, navigation }) => {
  const userData = route.params?.parentData || {};
  const parent = userData.parent || {};
  const children = userData.childData || {};
      const alertContext = useAlert()
  const [transcriptData, setTranscriptData] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  const s_id = children.id;

  useEffect(() => {
    if (s_id) {
      fetchStudentData();
    }
  }, [s_id]);
  const handleDownloadTranscript = async () => {
        try {
            const downloadsPath = RNFetchBlob.fs.dirs.DownloadDir;
            const fileName = `Transcript_${s_id}_${Date.now()}.pdf`;
            const filePath = `${downloadsPath}/${fileName}`;
        
            alertContext.showAlert('info', 'Starting download...', 'Transcript', 3000);
        
            let downloadStarted = false;
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
                }
            }).fetch(
                'GET',
                `${API_URL}/api/Students/TranscriptPDF?student_id=${s_id}`,
                { 'Content-Type': 'application/pdf' }
            );
        
            const timeout = setTimeout(() => {
                if (!downloadStarted) {
                    downloadTask.cancel();
                    throw new Error('Download timed out - server not responding');
                }
            }, 15000);
        
            downloadTask.progress((received, total) => {
                downloadStarted = true;
                console.log(`Progress: ${received}/${total}`);
            });
        
            const res = await downloadTask;
            clearTimeout(timeout);
        
            const fileExists = await RNFetchBlob.fs.exists(res.path());
            if (!fileExists) {
                throw new Error('File not found after download');
            }
        
            const stats = await RNFetchBlob.fs.stat(res.path());
            if (stats.size < 100) {
                await RNFetchBlob.fs.unlink(res.path());
                throw new Error('Downloaded file is too small (possibly invalid)');
            }
        
            alertContext.showAlert('success', 'Transcript downloaded successfully', 'Download Complete', 3000);
        
        } catch (error) {
            console.error('Download failed:', error);
            let errorMessage = 'Download failed';
            if (error.message.includes('timed out')) {
                errorMessage = 'Server took too long to respond';
            } else if (error.message.includes('ENOENT')) {
                errorMessage = 'Could not access storage';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Network error - check your connection';
            }
        
            alertContext.showAlert('error', errorMessage, 'Download Error', 3000);
        }
    };
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch Transcript
      const transcriptResponse = await fetch(`${API_URL}/api/Students/Transcript?student_id=${s_id}`);
      const transcriptResult = await transcriptResponse.json();
      if (transcriptResponse.ok) {
        setTranscriptData(transcriptResult|| []);
      }
console.log("Transcript Dassta:", transcriptData);
      // Fetch Timetable
      const timetableResponse = await fetch(`${API_URL}/api/Students/FullTimetable?student_id=${s_id}`);
      const timetableResult = await timetableResponse.json();
      if (timetableResponse.ok) {
        setTimetableData(timetableResult.data || []);
      }

      // Fetch Attendance
      const attendanceResponse = await fetch(`${API_URL}/api/Students/attendance?student_id=${s_id}`);
      const attendanceResult = await attendanceResponse.json();
      if (attendanceResponse.ok) {
        setAttendanceData(attendanceResult.data || []);
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      Alert.alert('Error', 'Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (tabName, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTabButton]}
      onPress={() => setActiveTab(tabName)}
    >
      <MaterialIcons 
        name={icon} 
        size={24} 
        color={activeTab === tabName ? colors.primary : colors.gray} 
      />
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderStudentInfo = () => (
    <View style={styles.contentContainer}>
      {/* Student Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: children.image || 'https://via.placeholder.com/100' }} 
            style={styles.profileImage}
            resizeMode="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.studentName}>{children.name}</Text>
            <Text style={styles.studentRegNo}>Reg: {children.regno}</Text>
            <Text style={styles.studentSection}>Section: {children.section}</Text>
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
          <MaterialIcons name="family-restroom" size={24} color={colors.primary} />
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
          <Text style={styles.infoValue}>{parent.phone || 'N/A'}</Text>
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
              {transcriptData.length > 0 ? 
                (transcriptData.reduce((sum, sem) => sum + parseFloat(sem.GPA), 0) / transcriptData.length).toFixed(2) : 
                'N/A'}
            </Text>
            <Text style={styles.statLabel}>CGPA</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="event-available" size={24} color={colors.primary} />
           <Text style={styles.statValue}>
  {attendanceData[0].Percentage} %
</Text>

            <Text style={styles.statLabel}>{attendanceData[0].course_name}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="book" size={24} color={colors.warning} />
            <Text style={styles.statValue}>
              {attendanceData.length}
            </Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTranscript = () => (
    <View style={styles.contentContainer}>
      {transcriptData.length > 0 ? (
        transcriptData.map((semester, index) => (
          <View key={index} style={styles.transcriptCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="assessment" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{semester.session_name}</Text>
              <View style={styles.gpaContainer}>
                <Text style={styles.gpaText}>GPA: {semester.GPA || 'N/A'}</Text>
              </View>
            </View>
            
            {semester.subjects && semester.subjects.map((subject, subIndex) => (
              <View key={subIndex} style={styles.courseRow}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{subject.course_name}</Text>
                  <Text style={styles.courseCode}>{subject.course_code}</Text>
                </View>
                <View style={styles.gradeInfo}>
<Text style={[styles.gradeText, {
  color: subject.grade === 'F' 
    ? 'red' 
    : subject.grade === 'A' 
      ? 'orange' 
      : colors.green
}]}>
  {subject.grade}
</Text>

                  <Text style={styles.creditText}>{subject.credit_hours} CH</Text>
                </View>
              </View>
            ))}
            
            <View style={styles.semesterSummary}>
              <Text style={styles.summaryText}>
                Credit Points: {semester.total_credit_points || 'N/A'}
              </Text>
            </View>
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
                          onPress={handleDownloadTranscript}
                      >
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
            
            {dayData.schedule && dayData.schedule.map((classItem, classIndex) => (
              <View key={classIndex} style={styles.classRow}>
                <View style={styles.timeContainer}>
                  <MaterialIcons name="schedule" size={16} color={colors.primary} />
                  <Text style={styles.timeText}>
                    {classItem.start_time} - {classItem.end_time}
                  </Text>
                </View>
                
                <View style={styles.classDetails}>
                  <Text style={styles.subjectName}>{classItem.coursename}</Text>
                  <Text style={styles.teacherName}>
                    {classItem.teachername}
                    {classItem.juniorlecturername && classItem.juniorlecturername !== 'N/A' 
                      ? ` & ${classItem.juniorlecturername}` 
                      : ''
                    }
                  </Text>
                  <View style={styles.classMeta}>
                    <MaterialIcons name="location-on" size={14} color={colors.gray} />
                    <Text style={styles.venueText}>{classItem.venue}</Text>
                    <MaterialIcons name="group" size={14} color={colors.gray} style={styles.sectionIcon} />
                    <Text style={styles.sectionText}>{classItem.section}</Text>
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
              <MaterialIcons name="event-available" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{subject.course_name}</Text>
              <View style={[styles.percentageBadge, {
                backgroundColor: subject.Percentage >= 75 ? colors.success : 
                                subject.Percentage >= 60 ? colors.warning : colors.red1
              }]}>
                <Text style={styles.percentageText}>{subject.Percentage}%</Text>
              </View>
            </View>
            
            <Text style={styles.courseDetails}>
              {subject.course_code} • {subject.section_name}
            </Text>
            
            <Text style={styles.teacherText}>
              Instructor: {subject.teacher_name}
              {subject.junior_lec_name !== 'N/A' && ` & ${subject.junior_lec_name}`}
            </Text>
            
            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{subject.Total_classes_conducted}</Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.success}]}>{subject.total_present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: colors.red1}]}>
                  {subject.total_absent || (subject.Total_classes_conducted - subject.total_present)}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
            </View>
            
            {subject.pending_requests_count > 0 && (
              <View style={styles.pendingContainer}>
                <MaterialIcons name="pending" size={16} color={colors.warning} />
                <Text style={styles.pendingText}>
                  {subject.pending_requests_count} Pending Request{subject.pending_requests_count > 1 ? 's' : ''}
                </Text>
              </View>
            )}
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Details</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomTabContainer}>
        {renderTabButton('info', 'Overview', 'info')}
        {renderTabButton('transcript', 'Transcript', 'assessment')}
        {renderTabButton('timetable', 'Timetable', 'schedule')}
        {renderTabButton('attendance', 'Attendance', 'event-available')}
      </View>
    </View>
  );
};

export default Child_info;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg || '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.gray || '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white || 'white',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },    downloadButton: {
        flexDirection: 'row',
        backgroundColor: '#1565c0',
        padding: 10,
        borderRadius: 5,
       
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    downloadButtonText: {
        color: 'white',
        marginLeft: 10,
        fontWeight: 'bold',
    },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark || '#333',
  },
  scrollView: {
    flex: 1,
    marginBottom: 60, // Space for bottom tabs
  },
  contentContainer: {
    padding: 15,
  },
  bottomSpacer: {
    height: 20,
  },
  
  // Bottom Tab Navigation
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white || 'white',
    borderTopWidth: 1,
    borderTopColor: colors.grayLight || '#eee',
    paddingVertical: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {

  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.gray || '#666',
  },
  activeTabText: {
    color: colors.primary || '#2a7fff',
    fontWeight: '600',
  },
  
  // Profile Card Styles
  profileCard: {
    backgroundColor: colors.white || 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
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
    borderColor: colors.primary || '#2a7fff',
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark || '#333',
    marginBottom: 4,
  },
  studentRegNo: {
    fontSize: 14,
    color: colors.primary || '#2a7fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  studentSection: {
    fontSize: 13,
    color: colors.gray || '#666',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight || '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.success || '#28a745',
    fontWeight: '600',
  },

  // Info Card Styles
  infoCard: {
    backgroundColor: colors.white || 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight || '#eee',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    color: colors.primaryDark || '#333',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray || '#666',
    marginLeft: 8,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: colors.primaryDark || '#333',
    fontWeight: '500',
    flex: 1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.grayLight || '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark || '#333',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray || '#666',
    textAlign: 'center',
  },

  // Transcript Styles
  transcriptCard: {
    backgroundColor: colors.white || 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  gpaContainer: {
    backgroundColor: colors.primary || '#2a7fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  gpaText: {
    color: colors.white || 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight || '#f0f0f0',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryDark || '#333',
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 13,
    color: colors.gray || '#666',
  },
  gradeInfo: {
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success || '#28a745',
    marginBottom: 2,
  },
  creditText: {
    fontSize: 12,
    color: colors.gray || '#666',
  },
  semesterSummary: {
    backgroundColor: colors.grayLight || '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 13,
    color: colors.primaryDark || '#333',
    textAlign: 'center',
  },

  // Timetable Styles
  timetableCard: {
    backgroundColor: colors.white || 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.primary || '#2a7fff',
    padding: 10,
    borderRadius: 6,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white || 'white',
    marginLeft: 8,
  },
  classRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary || '#2a7fff',
    paddingLeft: 12,
    marginBottom: 12,
    backgroundColor: colors.grayLight || '#f8f9fa',
    borderRadius: 6,
    padding: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary || '#2a7fff',
    marginLeft: 6,
  },
  classDetails: {
    marginLeft: 18,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark || '#333',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 13,
    color: colors.gray || '#666',
    marginBottom: 6,
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    fontSize: 12,
    color: colors.gray || '#666',
    marginLeft: 4,
  },
  sectionIcon: {
    marginLeft: 10,
  },
  sectionText: {
    fontSize: 12,
    color: colors.gray || '#666',
    marginLeft: 4,
  },

  // Attendance Styles
  attendanceCard: {
    backgroundColor: colors.white || 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentageText: {
    color: colors.white || 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  courseDetails: {
    fontSize: 13,
    color: colors.gray || '#666',
    marginBottom: 6,
  },
  teacherText: {
    fontSize: 13,
    color: colors.primary || '#2a7fff',
    marginBottom: 12,
    fontWeight: '500',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.grayLight || '#eee',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark || '#333',
    marginBottom: 2,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight || '#fff3cd',
    padding: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  pendingText: {
    fontSize: 12,
    color: colors.warning || '#856404',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.gray || '#999',
    textAlign: 'center',
  },
});