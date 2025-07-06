import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import Icon from "react-native-vector-icons/MaterialIcons";
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import { LayoutAnimation, UIManager, Platform } from 'react-native';

const AttendanceAll = ({ navigation, route }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const userData = route.params?.userData || {};
  
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  
  const [expandedCards, setExpandedCards] = useState({});
  
  const toggleCollapse = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Students/attendance?student_id=${userData.id}`);
        const data = await response.json();
        if (data.data) {
          const processedData = data.data.map(item => ({
            ...item,
            pending_requests: item.pending_requests || [],
            Percentage: item.Percentage ? Number(item.Percentage) : 0
          }));
          console.log('data'+processedData)
          setAttendanceData(processedData);
        }
        console.log("Attendance Data:", data.data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const CircularProgress = ({ percentage = 0, size = 80, strokeWidth = 8 }) => {
    // Ensure percentage is a valid number between 0-100
    const safePercentage = Math.min(100, Math.max(0, Number(percentage) || 0));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
    
 
    const getColor = (value) => {
      if (value < 75) return colors.redb1;
      if (value < 85) return colors.warning;
      return colors.success;
    };

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.blueGray}
            strokeWidth={strokeWidth}
            
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(percentage)}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          />
        </Svg>
        <Text style={{ 
          position: 'absolute',
          fontSize: 16,
          fontWeight: 'bold',
          color: getColor(percentage)
        }}>
          {percentage.toFixed(1)}%
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView>
    <View style={styles.main}>
      <Navbar
        title="Attendance"
        userName={userData.name}
        des={'Student'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />

      <View style={styles.container}>
        <Text style={styles.headerTitle}>Your Attendance Summary</Text>

        {attendanceData.length > 0 ? (
          attendanceData.map((subject, index) => (
            <View key={index} style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('SubjectAttendence', {
                    subject: subject,
                    userData
                  })
                }
              >
                <View style={styles.cardContent}>
                  <View style={styles.textContainer}>
                    <Text style={styles.courseName}>{subject.course_name}</Text>
                    <Text style={styles.courseDetails}>
                      {subject.course_code} · {subject.section_name} · {subject.course_lab}
                    </Text>
                    
                    <Text style={styles.teacherText}>
                      Taught by {subject.teacher_name}
                      {subject.junior_lec_name !== 'N/A' && ` & ${subject.junior_lec_name}`}
                    </Text>
                    
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Classes</Text>
                        <Text style={styles.statValue}>{subject.Total_classes_conducted}</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Present</Text>
                        <Text style={[styles.statValue, styles.presentText]}>{subject.total_present}</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Absent</Text>
                        <Text style={[styles.statValue, styles.absentText]}>
                          {subject.total_absent ?? (subject.Total_classes_conducted - subject.total_present)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.updatedText}>
                      Last updated: {
                        isNaN(new Date(subject.Updated_at).getTime())
                          ? 'N/A'
                          : new Date(subject.Updated_at).toLocaleDateString()
                      }
                    </Text>
                    
                    {(subject.pending_requests_count > 0) && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>
                          {subject.pending_requests_count} Pending Request{subject.pending_requests_count > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.progressContainer}>
                  <CircularProgress 
  percentage={Number(subject.Percentage) || 0} 
  size={80} 
  strokeWidth={7} 
/>
                    
                  </View>
                </View>
              </TouchableOpacity>
              
              {(subject.pending_requests_count > 0) && (
                <>
                  <TouchableOpacity 
                    onPress={() => toggleCollapse(index)}
                    style={styles.viewPendingButton}
                  >
                    <Text style={styles.viewPendingText}>
                      {expandedCards[index] ? 'Hide' : 'View'} Pending Request{subject.pending_requests_count > 1 ? 's' : ''}
                      <Icon 
                        name={expandedCards[index] ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                        size={20} 
                        color={colors.warning}
                      />
                    </Text>
                  </TouchableOpacity>

                  {expandedCards[index] && (
                    <View style={styles.pendingRequestsContainer}>
                      {subject.pending_requests.map((request, i) => (
                        <View key={i} style={styles.requestItem}>
                          <View style={styles.requestRow}>
                            <Icon name="event" size={16} color={colors.primary} />
                            <Text style={styles.requestText}>
                              {new Date(request.date_time).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={styles.requestRow}>
                            <Icon name="place" size={16} color={colors.primary} />
                            <Text style={styles.requestText}>
                              Venue: {request.venue}
                            </Text>
                          </View>
                          <View style={styles.requestRow}>
                            <Icon name="info" size={16} color={colors.primary} />
                            <Text style={styles.requestText}>
                              Type: {request.type}
                            </Text>
                          </View>
                          <View style={styles.requestRow}>
                            <Icon name="schedule" size={16} color={colors.primary} />
                            <Text style={styles.requestText}>
                              Status: Pending
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="info-outline" size={48} color={colors.gray} />
            <Text style={styles.emptyText}>No attendance records found</Text>
          </View>
        )}
      </View>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: colors.gray,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,  // Add fixed width
    height: 80, 
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    opacity: 0.7,
    marginBottom: 8,
  },
  teacherText: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 16,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 13,
    color: colors.blueNavy,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  presentText: {
    color: colors.success,
  },
  absentText: {
    color: colors.red1,
  },
  updatedText: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  pendingBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pendingText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    marginTop: 12,
  },
  viewPendingButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  viewPendingText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingRequestsContainer: {
    backgroundColor: colors.grayLight,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  requestItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestText: {
    fontSize: 14,
    color: colors.black,
    marginLeft: 8,
  },
});

export default AttendanceAll;