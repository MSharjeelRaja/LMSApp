import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';

const ConsideredTasks = ({ route, navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState({});
  const userData = route.params?.userData || {};

  useEffect(() => {
    fetch(`${API_URL}/api/Students/task/evaluated?student_id=${userData.id}`)
      .then(response => response.json())
      .then(json => {
        if (json.status === 'success') {
          setData(json.data);
          const initialExpanded = {};
          json.data.forEach(course => {
            initialExpanded[course.teacher_offered_course_id] = false;
          });
          setExpandedCourses(initialExpanded);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, [userData.id]);

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const tasksProgressWheel = ({ percentage, color }) => {
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <View style={styles.progressContainer}>
        <Svg height={size} width={size}>
          <Circle
            stroke="#E2E8F0"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
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
              {percentage + '%'}
            </SvgText>
            <SvgText
              x={size / 2}
              y={size / 2 + 16}
              fontSize="8"
              fill="#64748B"
              textAnchor="middle"
            >
              tasks
            </SvgText>
          </G>
        </Svg>
      </View>
    );
  };

  const renderTaskItem = ({ item }) => (
    <View style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskPoints}>{item.obtained_points}/{item.points}</Text>
      </View>
      <View style={styles.taskDetails}>
        <Text style={styles.taskType}>Type: {item.type}</Text>
        <Text style={styles.taskCreatedBy}>Evaluated by: {item.created_by}</Text>
      </View>
      <View style={styles.taskDates}>
        <Text style={styles.taskDate}>Start: {new Date(item.start_date).toLocaleString()}</Text>
        <Text style={styles.taskDate}>Due: {new Date(item.due_date).toLocaleString()}</Text>
      </View>
    </View>
  );

  const renderCourse = ({ item }) => {
    const isExpanded = expandedCourses[item.teacher_offered_course_id];
    const hasLab = item.IsLab;
    
    // Prepare all tasks, filtering LabTask if needed
    const allTasks = item.Tasks ? item.Tasks.filter(task => {
      if (task.type === 'LabTask' && !hasLab) {
        return false;
      }
      return true;
    }) : [];
    
    // Calculate totals based on allTasks
    const totalTasks = allTasks.length;
    const totalPoints = allTasks.reduce((sum, task) => sum + (task.points || 0), 0);
    const totalObtained = allTasks.reduce((sum, task) => sum + (task.obtained_points || 0), 0);
    const percentage = totalPoints > 0 ? Math.round((totalObtained / totalPoints) * 100) : 0;
    
    // Collect considered tasks
    const consideredTasks = [];
    if (item.Considered) {
      Object.entries(item.Considered).forEach(([taskType, roles]) => {
        // Skip LabTask if course doesn't have lab
        if (taskType === 'LabTask' && !hasLab) {
          return;
        }
        // Iterate through each role (Teacher, Junior Lecturer)
        Object.values(roles).forEach((tasks) => {
          if (Array.isArray(tasks)) {
            consideredTasks.push(...tasks);
          }
        });
      });
    }

    return (
      <View style={styles.courseContainer}>
        <TouchableOpacity 
          style={styles.courseHeader} 
          onPress={() => toggleCourse(item.teacher_offered_course_id)}
        >
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{item.course_name}</Text>
            <Text style={styles.courseSection}>{item.section} {hasLab ? '(Lab)' : ''}</Text>
          </View>
          <View style={styles.courseStats}>
            {tasksProgressWheel({ percentage, color: colors.primary })}
          </View>
          <Icon 
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={24} 
            color={colors.dark} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.courseDetails}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Tasks:</Text>
                <Text style={styles.summaryValue}>{totalTasks}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Points:</Text>
                <Text style={styles.summaryValue}>{totalPoints}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Obtained Points:</Text>
                <Text style={styles.summaryValue}>{totalObtained}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Percentage:</Text>
                <Text style={styles.summaryValue}>{percentage}%</Text>
              </View>
            </View>
            
            {/* Consideration Summary */}
            <Text style={styles.sectionTitle}>Consideration Summary</Text>
            {item.Consideration_Summary && Object.keys(item.Consideration_Summary).length > 0 ? (
              <View style={styles.considerationContainer}>
                {Object.entries(item.Consideration_Summary).map(([type, summary]) => (
                  <View key={type} style={styles.considerationCard}>
                    <Text style={styles.considerationTitle}>{type}</Text>
                    <View style={styles.considerationDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total:</Text>
                        <Text style={styles.detailValue}>{summary.Total ?? 0}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Teacher:</Text>
                        <Text style={styles.detailValue}>{summary.Teacher ?? 0}</Text>
                      </View>
                      {/* Only show Junior Lecturer if course has lab or if there's data for it */}
                      {(hasLab || summary['Junior Lecturer']) && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Junior Lecturer:</Text>
                          <Text style={styles.detailValue}>{summary['Junior Lecturer'] ?? 0}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noTasksText}>No consideration summary available</Text>
            )}
            
            <Text style={styles.sectionTitle}>All Tasks</Text>
            {allTasks.length > 0 ? (
              <FlatList
                data={allTasks}
                renderItem={renderTaskItem}
                keyExtractor={(task) => task.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noTasksText}>No tasks for this course</Text>
            )}
            
            <Text style={styles.sectionTitle}>Considered Tasks</Text>
            {consideredTasks.length > 0 ? (
              <FlatList
                data={consideredTasks}
                renderItem={renderTaskItem}
                keyExtractor={(task) => task.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.noTasksText}>No considered tasks for this course</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Navbar
        title="LMS"
        userName={userData.name}
        des={'Student'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.pageTitle}>Considered Tasks</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : data.length > 0 ? (
          <FlatList
            data={data}
            renderItem={renderCourse}
            keyExtractor={(item) => item.teacher_offered_course_id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noDataText}>No considered tasks found</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.dark,
  },
  courseContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  courseSection: {
    fontSize: 14,
    color: colors.gray,
  },
  courseStats: {
    marginHorizontal: 16,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  summaryCard: {
    backgroundColor: colors.lightPrimary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: colors.dark,
  },
  summaryValue: {
    color: colors.dark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: colors.dark,
  },
  considerationContainer: {
    marginBottom: 16,
  },
  considerationCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginBottom: 8,
    overflow: 'hidden',
  },
  considerationTitle: {
    backgroundColor: colors.lightPrimary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: 'bold',
    color: colors.dark,
    fontSize: 15,
  },
  considerationDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskTitle: {
    fontWeight: 'bold',
    flex: 1,
    color: colors.dark,
  },
  taskPoints: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskType: {
    color: colors.gray,
  },
  taskCreatedBy: {
    color: colors.gray,
  },
  taskDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskDate: {
    fontSize: 12,
    color: colors.gray,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.gray,
    marginTop: 32,
    fontSize: 16,
  },
  noTasksText: {
    textAlign: 'center',
    color: colors.gray,
    marginVertical: 12,
    fontSize: 14,
  },
  noDataText: {
    textAlign: 'center',
    color: colors.gray,
    marginTop: 32,
    fontSize: 16,
  },
});

export default ConsideredTasks;