import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  BackHandler,
  Modal,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {AntDesign, FontAwesome5} from 'react-native-vector-icons';
import {Navbar} from '../ControlsAPI/Comps';
import {Title} from 'react-native-paper';
import colors from '../ControlsAPI/colors';
import Task from './Task';
import AttendeceAll from './AttendeceAll';
import coursecontent from './CourseContent';
import pendingtaskss from './Pendingtasks';
import Courses from './Courses';
import FullTimetable from './FullTimeTable';
import SubjectAttendence from './SubjectAttendence';

const Tab = createBottomTabNavigator();

const S_Home = ({navigation, route}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  useEffect(() => {
    const handleBackPress = () => {
      if (navigation.isFocused()) {
        navigation.replace('Login');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [navigation]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isCurrentClass = (start, end) => {
    const toMinutes = time => {
      const [h, m] = time.slice(0, 5).split(':').map(Number);
      return h * 60 + m;
    };

    const now = new Date();
    let hours = now.getHours();
    const isPM = hours >= 12;

    if (isPM && hours > 12) hours -= 12;
    if (!isPM && hours === 0) hours = 12;

    const currentMinutes = hours * 60 + now.getMinutes();

    return (
      currentMinutes >= toMinutes(start) && currentMinutes <= toMinutes(end)
    );
  };

  const formatTimeTo12Hour = timeStr => {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour);

    let ampm = 'AM';
    if (h >= 12 || h <= 7) {
      ampm = 'PM';
    } else if (h >= 8 && h < 12) {
      ampm = 'AM';
    }

    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const userData = route.params?.userData || {};
  global.sid = userData.id;
  userData.name = userData.name?.split(' ').slice(0, 2).join(' ');
  console.log('name ' + userData.name);
  const timetable = userData.Reschedule
    ? Object.values(userData.Reschedule)
    : userData.Timetable
    ? Object.values(userData.Timetable)
    : [];
  const courseCount = new Set(timetable.map(item => item.coursename)).size;

  return (
    <ScrollView>
      <View style={styles.container}>
        <Navbar
          title="LMS"
          userName={userData.name}
          des={'Student'}
          onLogout={() => navigation.replace('Login')}
        />

        <View style={styles.profileContainer}>
          <Image
            source={
              userData.Image
                ? {uri: userData.Image}
                : require('../images/as.png')
            }
            style={styles.profileImage}
            resizeMode="cover"
          />

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.name}</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('notification', userData)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: 8,
              }}>
              <Icon name="notifications" size={25} color="white" />
            </TouchableOpacity>

            <Text style={styles.userInfo}>{userData.Program}</Text>
            <Text style={styles.userInfo}>{userData.RegNo}</Text>
            <Text style={styles.userInfo}>CGPA: {userData.CGPA}</Text>

            <View style={styles.buttonContainer}>
              {userData['Is Grader ?'] && (
                <TouchableOpacity
                  style={styles.graderButton}
                  onPress={() => navigation.navigate('grader', userData)}>
                  <Text style={styles.buttonText}>Switch to Grader</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setIsModalVisible(true)}>
                <Text style={styles.buttonText}>View Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Timetable Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('FullTimetables', {userData})}>
            <Text style={styles.seeAllText}>See All</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableHeaderText}>Time</Text>
            <Text style={styles.tableHeaderText}>Course</Text>
            <Text style={styles.tableHeaderText}>Venue</Text>
          </View>
          <FlatList
            data={timetable}
            keyExtractor={item => item.start_time + item.coursename}
            renderItem={({item}) => {
              const isActive = isCurrentClass(item.start_time, item.end_time);
              return (
                <View style={[styles.tableRow, isActive && styles.highlight]}>
                  <Text
                    style={[
                      styles.tableCell,
                      isActive && styles.highlightText,
                    ]}>
                    {`${formatTimeTo12Hour(
                      item.start_time,
                    )}\n${formatTimeTo12Hour(item.end_time)}`}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      isActive && styles.highlightText,
                    ]}>
                    {item.coursename}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      isActive && styles.highlightText,
                    ]}>
                    {item.venue}
                  </Text>
                </View>
              );
            }}
          />
        </View>

        {userData.Notice && (
          <Text style={styles.rescheduleNotice}>{userData.Notice}</Text>
        )}

        <View style={styles.attendanceSummary}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attendance Summary</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Attendance')}>
              <Text style={styles.seeAllText}>See All</Text>
              <Icon name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.attendanceScrollContainer}>
            {userData.Attendance && userData.Attendance.length > 0 ? (
              userData.Attendance.map(item => (
                <TouchableOpacity
                  key={item.course_code}
                  style={[
                    styles.attendanceCard,
                    item.Percentage < 75 && styles.lowAttendanceCard,
                  ]}
                  onPress={() => navigation.navigate('Attendance')}>
                  <View style={styles.attendanceCardContent}>
                    <Text style={styles.attendanceCourse} numberOfLines={2}>
                      {item.course_name}
                    </Text>
                    <View style={styles.attendancePercentageContainer}>
                      <Text style={styles.attendancePercentage}>
                        {item.Percentage.toFixed(1)}%
                      </Text>
                      <View style={styles.attendanceProgressBar}>
                        <View
                          style={[
                            styles.attendanceProgressFill,
                            {
                              width: `${item.Percentage}%`,
                              backgroundColor:
                                item.Percentage >= 75 ? '#4CAF50' : '#F44336',
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.attendanceStatsContainer}>
                      <View style={styles.attendanceStat}>
                        <Icon name="check-circle" size={14} color="#4CAF50" />
                        <Text style={styles.attendanceStatText}>
                          {item.total_present}
                        </Text>
                      </View>
                      <View style={styles.attendanceStat}>
                        <Icon name="cancel" size={14} color="#F44336" />
                        <Text style={styles.attendanceStatText}>
                          {item.total_absent}
                        </Text>
                      </View>
                      <View style={styles.attendanceStat}>
                        <Icon name="event" size={14} color="#2196F3" />
                        <Text style={styles.attendanceStatText}>
                          {item.Total_classes_conducted}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noAttendanceCard}>
                <Icon name="info-outline" size={24} color={colors.gray} />
                <Text style={styles.noAttendanceText}>
                  No attendance data available
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Task</Text>
        </View>

        {userData.Task_Info && userData.Task_Info.length > 0 ? (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => navigation.navigate('Task')}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskCourse}>
                {userData.Task_Info[0].course_name}
              </Text>
              <Text style={styles.taskType}>{userData.Task_Info[0].type}</Text>
            </View>
            <Text style={styles.taskTitle}>{userData.Task_Info[0].title}</Text>
            <View style={styles.taskFooter}>
              <Text style={styles.taskDue}>
                Due: {new Date(userData.Task_Info[0].due_date).toLocaleString()}
              </Text>
              <Text style={styles.taskPoints}>
                {userData.Task_Info[0].points} points
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noTaskCard}>
            <Text style={styles.noTaskText}>No upcoming tasks</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Exam', {userData})}>
              <Icon name="assignment" size={24} color="white" />
              <Text style={styles.actionButtonText}>Exams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('calender', {userData})}>
              <Icon name="calendar-today" size={24} color="white" />
              <Text style={styles.actionButtonText}>Calendar</Text>
            </TouchableOpacity>
          </View>

          {/* <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('datesheet', {userData})}>
              <Icon name="event-note" size={24} color="white" />
              <Text style={styles.actionButtonText}>Datesheet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton,{backgroundColor:colors.red1}]}
              onPress={() => navigation.navigate('Restrictions', {userData})}>
              <Icon name="lock" size={24} color="white" />
              <Text style={styles.actionButtonText}>Parent Restrictions</Text>
            </TouchableOpacity>
          </View> */}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('AllCourses_Content', {userData})
              }>
              <Icon name="menu-book" size={24} color="white" />
              <Text style={styles.actionButtonText}>All Courses</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('ConsideredTasks', {userData})
              }>
              <Icon name="task" size={24} color="white" />
              <Text style={styles.actionButtonText}>Considered</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Info Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Student Details</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{userData.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gender:</Text>
                  <Text style={styles.infoValue}>{userData.Gender}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Guardian:</Text>
                  <Text style={styles.infoValue}>{userData.Guardian}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Intake:</Text>
                  <Text style={styles.infoValue}>{userData.InTake}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Current Session:</Text>
                  <Text style={styles.infoValue}>
                    {userData['Current Session']}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const BottomTabs = ({navigation, route}) => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Task') iconName = 'assignment';
          else if (route.name === 'Courses') iconName = 'menu-book';
          else if (route.name === 'Attendance') iconName = 'library-books';

          return (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={iconName} size={size} color={color} />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          );
        },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
      })}>
      <Tab.Screen name="Home" component={S_Home} initialParams={route.params} />
      <Tab.Screen
        name="Courses"
        component={Courses}
        initialParams={route.params}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendeceAll}
        initialParams={route.params}
      />
      <Tab.Screen name="Task" component={Task} initialParams={route.params} />
    </Tab.Navigator>
  );
};

export default BottomTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Profile Section
  profileContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 10,
    marginHorizontal: 12,
    margin: 10,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 3,
  },
  userInfo: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  graderButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  infoButton: {
    backgroundColor: colors.info,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },

  // Attendance Summary Styles
  attendanceSummary: {
    marginHorizontal: 12,
    marginBottom: 15,
  },
  attendanceScrollContainer: {
    paddingVertical: 5,
  },
  attendanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 180,
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  lowAttendanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  attendanceCardContent: {
    padding: 15,
  },
  attendanceCourse: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 10,
    minHeight: 40,
  },
  attendancePercentageContainer: {
    marginBottom: 12,
  },
  attendancePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  attendanceProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  attendanceProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  attendanceStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceStatText: {
    fontSize: 12,
    marginLeft: 4,
    color: colors.dark,
  },
  noAttendanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: 180,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  noAttendanceText: {
    color: colors.gray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    paddingHorizontal: 15,
    marginTop: 10,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },

  // Timetable Styles
  table: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 15,
    minHeight: 100,
    backgroundColor: colors.white,
    elevation: 3,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  tableHeader: {
    backgroundColor: colors.primary,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.white,
    fontSize: 14,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: colors.dark,
  },
  highlight: {
    backgroundColor: colors.blueNavy,
  },
  highlightText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  rescheduleNotice: {
    color: 'red',
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: -10,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 12,
  },

  // Task Card Styles
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 12,
    marginBottom: 15,
    elevation: 3,
  },
  noTaskCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskCourse: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  taskType: {
    fontSize: 13,
    color: colors.gray,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskDue: {
    fontSize: 12,
    color: colors.gray,
  },
  taskPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  noTaskText: {
    color: colors.gray,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtonsContainer: {
    marginHorizontal: 12,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#007bff',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 13,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontWeight: '600',
    color: colors.dark,
    width: '23%',
  },
  infoValue: {
    color: colors.black,
    width: '63%',
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Tab Bar Styles
  tabBarStyle: {
    backgroundColor: colors.primaryDark,
    height: 60,
    paddingBottom: 10,
    paddingTop: 5,
    borderTopWidth: 0,
    elevation: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  activeIndicator: {
    marginTop: 6,
  },
});
