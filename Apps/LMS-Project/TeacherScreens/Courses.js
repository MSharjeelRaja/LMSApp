import { 
    StyleSheet, 
    Text, 
    View, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Image, 
    Modal, 
    TextInput,
    Alert
  } from 'react-native'
  import React, { useState, useEffect } from 'react'
  import { Picker } from '@react-native-picker/picker';
  import { API_URL, Navbar } from '../ControlsAPI/Comps';
  import colors from '../ControlsAPI/colors';
  
  const Courses = ({navigation, route}) => {
    const userData = route.params.userData;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('current');
    const [courses, setCourses] = useState({
      active: [],
      previous: {}
    });
    const [selectedSession, setSelectedSession] = useState('All Sessions');
  
    useEffect(() => {
      const fetchCourses = async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/Teachers/your-courses?teacher_id=${userData.id}`
          );
          const data = await response.json();
          
          if (data.status === 'success') {
            setCourses({
              active: data.data.active_courses,
              previous: data.data.previous_courses
            });
          } else {
            setError('Failed to fetch courses');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchCourses();
    }, []);
  
    const renderCourseCard = (course) => (
      <TouchableOpacity 
        style={styles.courseCard} 
        key={course.teacher_offered_course_id}
        onPress={() => navigation.navigate('CourseInfo', { 
          courseData: course,
          userData: userData 
        })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.courseTitle}>{course.course_name}</Text>
            <Text style={styles.courseCode}>{course.course_code}</Text>
          </View>
          {course.lab === "Yes" && (
            <View style={styles.labBadge}>
              <Text style={styles.labText}>Lab</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Section:</Text>
            <Text style={styles.infoValue}>{course.section_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Enrollments:</Text>
            <Text style={styles.infoValue}>{course.total_enrollments}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Credit Hours:</Text>
            <Text style={styles.infoValue}>{course.credit_hours}</Text>
          </View>
          {course.lab === "Yes" && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lab Junior:</Text>
              <Text style={styles.infoValue}>{course.junior_name || 'N/A'}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  
    const getCurrentSession = () => {
      if (courses.active.length > 0) {
        return courses.active[0].session_name;
      }
      return 'N/A';
    };
  
    const getPreviousSessions = () => {
      return Object.keys(courses.previous);
    };
  
    const filterCoursesBySession = (session) => {
      if (session === 'All Sessions') {
        return Object.values(courses.previous).flat();
      }
      return courses.previous[session] || [];
    };
  
    const renderPreviousSessions = () => {
      const sessions = getPreviousSessions();
      
      return (
        <View>
          <View style={styles.sessionFilterContainer}>
            <Text style={styles.filterLabel}>Filter by Session:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedSession}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedSession(itemValue)}
                mode="dropdown"
              >
                <Picker.Item label="All Sessions" value="All Sessions" />
                {sessions.map((session) => (
                  <Picker.Item key={session} label={session} value={session} />
                ))}
              </Picker>
            </View>
          </View>
  
          {filterCoursesBySession(selectedSession).map(renderCourseCard)}
        </View>
      );
    };
  
    if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
    if (error) return <Text style={styles.error}>{error}</Text>;
  
    return (
      <View style={styles.container}>
        <Navbar
          title="LMS"
          userName={userData.name}
          des={'Teacher'}
          showBackButton={true}
          onLogout={() => navigation.replace('Login')}
        />
  
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'current' && styles.activeTab]}
            onPress={() => setActiveTab('current')}
          >
            <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
              Current courses ({courses.active.length})
            </Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={[styles.tab, activeTab === 'previous' && styles.activeTab]}
            onPress={() => setActiveTab('previous')}
          >
            <Text style={[styles.tabText, activeTab === 'previous' && styles.activeTabText]}>
              Previous courses ({Object.values(courses.previous).flat().length})
            </Text>
          </TouchableOpacity>
        </View>
  
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {activeTab === 'current' ? (
            <View>
              <Text style={styles.currentSessionHeader}>
                Current Session: {getCurrentSession()}
              </Text>
              {courses.active.map(renderCourseCard)}
            </View>
          ) : (
            renderPreviousSessions()
          )}
        </ScrollView>
      </View>
    )
  }
  
  export default Courses;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
    },
    error: {
      flex: 1,
      color: colors.red1,
      textAlign: 'center',
      padding: 20,
      backgroundColor: colors.white,
    },
    tabsContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      overflow: 'hidden',
      elevation: 2,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: colors.white,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.blueGray,
    },
    activeTabText: {
      color: colors.white,
    },
    scrollContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    courseCard: {
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: colors.dark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.primaryLight,
      paddingBottom: 8,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.title,
    },
    courseCode: {
      fontSize: 16,
      color: colors.orange,
      marginTop: 4,
      fontWeight: '600',
    },
    cardBody: {
      gap: 10,
      marginTop: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoLabel: {
      color: colors.dark,
      fontSize: 14,
      fontWeight: '500',
    },
    infoValue: {
      color: colors.primaryDark,
      fontSize: 14,
      fontWeight: '600',
    },
    currentSessionHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 16,
      paddingLeft: 8,
      backgroundColor: colors.primaryFaint,
      paddingVertical: 8,
      borderRadius: 8,
      textAlign: 'center',
    },
    labBadge: {
      backgroundColor: colors.blueNavy,
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: 'flex-start',
      elevation: 2,
    },
    labText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    sessionFilterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      justifyContent: 'space-between',
      backgroundColor: colors.white,
      padding: 12,
      borderRadius: 8,
      elevation: 2,
    },
    filterLabel: {
      fontSize: 14,
      color: colors.dark,
      marginRight: 8,
      fontWeight: '600',
    },
    pickerContainer: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.primaryLight,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.white,
    },
    picker: {
      height: 50,
      width: '100%',
      color: colors.primaryDark,
      backgroundColor: colors.white,
    },
    // Additional styles for better UI
    sectionHeader: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryDark,
      marginVertical: 8,
      paddingLeft: 8,
      backgroundColor: colors.primaryFaint,
      paddingVertical: 6,
      borderRadius: 6,
    },
    enrollmentHighlight: {
      backgroundColor: colors.Greenborder3,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    juniorContainer: {
      backgroundColor: colors.infoLight,
      padding: 6,
      borderRadius: 8,
      marginTop: 4,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.primaryLight,
    },
    creditHoursBadge: {
      backgroundColor: colors.green2,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    creditHoursText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: 'bold',
    },
  });