import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import colors from '../ControlsAPI/colors';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { BlurView } from '@react-native-community/blur';

const SubjectAttendence = ({ navigation, route }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isContesting, setIsContesting] = useState(false);
  const userData = route.params?.userData || {};
  const subject = route.params?.subject || {};
console.log('uuuuu'+global.sid)
console.log('ssssss'+subject.teacher_offered_course_id)
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/Students/attendancePerSubject?student_id=${global.sid}&teacher_offered_course_id=${subject.teacher_offered_course_id}`
        );
        const data = await response.json();
        setAttendanceData(data.data);
        console.log('Attendance Dat:', data.data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch attendance details');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return '#22C55E'; // Brighter green
    if (percentage >= 75) return '#FBBF24'; // Bright amber
    return '#EF4444'; // Bright red
  };

  const handleContestAttendance = (session) => {
    Alert.alert(
      "Contest Attendance",
      `Are you sure you want to contest your attendance for ${new Date(session.date).toDateString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contest", onPress: () => submitAttendanceContest(session) }
      ]
    );
  };

  const submitAttendanceContest = async (session) => {
    setIsContesting(true);
    try {
      console.log('Contest Attendance:', session);
      console.log('Contest Attendance ID:', session.id);
      const response = await fetch(
        `${API_URL}/api/Students/contest-attendance?attendance_id=${session.id}`,
        {
          method: 'Post', // or 'POST' depending on your API
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  console.log('Contest Attendance Response:', response);
      if (response.ok) {
        Alert.alert(
          "Contest Submitted",
          "Your attendance contest has been submitted for review.",
          [{ text: "OK" }]
        );
      } else {
        throw new Error('Failed to submit contest');
      }
    } catch (error) {
      Alert.alert("Error", "Failed to submit attendance contest.");
    }finally {
      setIsContesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#1E293B" barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const attendancePercentage = attendanceData?.Total?.percentage
    ? parseFloat(Number(attendanceData.Total.percentage).toFixed(1))
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E293B" barStyle="light-content" />
      <Navbar
        title="Attendance"
        userName={userData.name}
        des="Student"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseCode}>{subject.course_code || 'CS101'}</Text>
            <Text style={styles.courseName}>{subject.course_name}</Text>
            <Text style={styles.teacherName}>{subject.teacher_name} - {subject.junior_lec_name} • {subject.section_name}</Text>
          </View>
        </View>

        {/* Attendance Overview Card */}
        <View style={styles.overviewContainer}>
          <View style={styles.attendanceStatusRow}>
            <AttendanceProgressWheel 
              percentage={attendancePercentage} 
              color={getAttendanceColor(attendancePercentage)} 
            />
            
            <View style={styles.statsGroup}>
              <StatBox 
                value={attendanceData?.Total?.total_classes} 
                label="Total" 
                icon="event"
                color="#64748B"
              />
              <StatBox 
                value={attendanceData?.Total?.total_present} 
                label="Present" 
                icon="check-circle"
                color="#22C55E" 
              />
              <StatBox 
                value={attendanceData?.Total?.total_absent} 
                label="Absent" 
                icon="cancel"
                color="#EF4444"
              />
            </View>
          </View>
        </View>

        {/* Tab Section Titles */}
        <View style={styles.sectionTypeRow}>
        <SectionTypeTab 
  title="Class Sessions" 
  icon="class"
  data={attendanceData?.Class || {}}
/>
<SectionTypeTab 
  title="Lab Sessions" 
  icon="science"
  data={attendanceData?.Lab || {}}
/>
        </View>

   
        <AttendanceSection
  title="Class Sessions"
  data={attendanceData?.Class}
  icon="class"
  handleContestAttendance={handleContestAttendance}
  isContesting={isContesting}
/>

<AttendanceSection
  title="Lab Sessions"
  data={attendanceData?.Lab}
  icon="science"
  handleContestAttendance={handleContestAttendance}
  isContesting={isContesting}
/>
      </ScrollView>
    </View>
  );
};

const AttendanceProgressWheel = ({ percentage, color }) => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <View style={styles.progressContainer}>
      <Svg height={size} width={size}>
        {/* Background Circle */}
        <Circle
          stroke="#E2E8F0"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
        <G>
          <SvgText
            x={size / 2}
            y={size / 2 - 3}
            fontSize="18"
            fontWeight="bold"
            fill="#1E293B"
            textAnchor="middle"
          >
            {percentage+'%'}
          </SvgText>
          <SvgText
            x={size / 2}
            y={size / 2 + 16}
            fontSize="8"
            fill="#64748B"
            textAnchor="middle"
          >
            Attendance
          </SvgText>
        </G>
      </Svg>
    </View>
  );
};

const StatBox = ({ value, label, icon, color }) => (
  <View style={styles.statBox}>
    <Icon name={icon} size={18} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionTypeTab = ({ title, icon, data = {} }) => (
  <View style={styles.sectionTab}>
    <Icon name={icon} size={16} color="#1E293B" />
    <Text style={styles.tabTitle}>{title}</Text>
    <View style={styles.tabBadge}>
      <Text style={styles.tabBadgeText}>
        {(data?.total_present ?? 0)}/{(data?.total_classes ?? 0)}
      </Text>
    </View>
  </View>

);

const canContestAttendance = (date) => {
  const sessionDate = new Date(date);
  const currentDate = new Date();
  const timeDifference = currentDate - sessionDate;
  const hoursDifference = timeDifference / (1000 * 60 * 60);
  return hoursDifference < 24;
};

const AttendanceSection = ({ title, data, icon, handleContestAttendance, isContesting  }) => (
  <View style={styles.sessionsContainer}>
    {data.records.length === 0 ? (
      <View style={styles.emptyState}>
        <Icon name="event-busy" size={32} color="#94A3B8" />
        <Text style={styles.emptyText}>No {title.toLowerCase()} found</Text>
      </View>
    ) : (
      <>
        {data.records.map((session, index) => {
          const canContest = canContestAttendance(session.date);
          const showContestButton = session.status === 'Absent' && canContest;
          const isPresent = session.status === 'Present';
          
          return (
            <View key={index} style={styles.sessionCard}>
              <View style={styles.sessionCardHeader}>
                <View style={styles.dateSection}>
                  <Text style={styles.sessionDay}>
                    {new Date(session.date).getDate()}
                  </Text>
                  <Text style={styles.sessionMonth}>
                    {new Date(session.date).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
                
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTime}>{session.time || '10:00 AM'}</Text>
                  <Text style={styles.sessionVenue}>{session.venue || 'Room 101'}</Text>
                </View>
                
                <View style={[styles.statusIndicator, { 
                  backgroundColor: isPresent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: isPresent ? '#22C55E' : '#EF4444'
                }]}>
                  <Icon 
                    name={isPresent ? 'check' : 'close'} 
                    size={14} 
                    color={isPresent ? '#22C55E' : '#EF4444'} 
                  />
                  <Text style={[styles.statusText, { 
                    color: isPresent ? '#22C55E' : '#EF4444' 
                  }]}>
                    {session.status}
                  </Text>
                </View>
              </View>
              
              {showContestButton && (
         <TouchableOpacity 
         style={styles.contestButton}
         onPress={() => handleContestAttendance(session)}
         disabled={isContesting}
       >
         {isContesting ? (
           <ActivityIndicator size="small" color="#fff" />
         ) : (
           <>
             <Icon name="gavel" size={14} color="#fff" />
             <Text style={styles.contestButtonText}>Contest</Text>
           </>
         )}
       </TouchableOpacity>
              )}
            </View>
          );
        })}
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  courseHeader: {
    
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  courseInfo: {
    marginBottom: 10,
  },
  courseCode: {
    fontSize: 13,
    color: 'white',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  overviewContainer: {
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#ffffff',

    elevation: 3,
  },
  attendanceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressContainer: {
    padding: 5,
  },
  statsGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 10,
  },
  statBox: {
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 8,
    flex: 1,
  },
  tabBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 12,
    color: '#64748B',
  },
  sessionsContainer: {
    marginHorizontal: 16,
    marginTop: 10,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSection: {
    alignItems: 'center',
    width: 40,
    marginRight: 12,
    borderRadius: 6,
    padding: 2,
    backgroundColor: '#F1F5F9',
  },
  sessionDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sessionMonth: {
    fontSize: 12,
    color: '#64748B',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  sessionVenue: {
    fontSize: 12,
    color: '#64748B',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  contestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  contestButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  emptyText: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 14,
  },
});

export default SubjectAttendence;