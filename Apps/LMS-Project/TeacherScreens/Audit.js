import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { API_URL, Navbar } from '../ControlsAPI/Comps';

const Audit = ({ route, navigation }) => {
  const { courseData, userData } = route.params;
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showWeekDropdown, setShowWeekDropdown] = useState(false);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/Teachers/audit?teacher_offered_course_id=${courseData.teacher_offered_course_id}`
      );
      const data = await response.json();
      if (data.status) {
        setAuditData(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch audit data');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      console.error('Audit fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = (content) => {
    if (!content) return { covered: 0, total: 0, percentage: 0 };
    
    let totalTopics = 0;
    let coveredTopics = 0;
    
    Object.values(content).forEach(weekContent => {
      weekContent.forEach(item => {
        if (item.topics) {
          totalTopics += item.topics.length;
          coveredTopics += item.topics.filter(topic => topic.status === 'Covered').length;
        }
      });
    });
    
    return {
      covered: coveredTopics,
      total: totalTopics,
      percentage: totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0
    };
  };

  const getWeeklyContent = (content, week) => {
    if (!content || !content[week.toString()]) return [];
    return content[week.toString()];
  };

  const getAvailableWeeks = () => {
    if (!auditData?.Course_Content_Report) return [];
    
    const allWeeks = new Set();
    Object.values(auditData.Course_Content_Report).forEach(sectionData => {
      if (sectionData.content) {
        Object.keys(sectionData.content).forEach(week => {
          allWeeks.add(parseInt(week));
        });
      }
    });
    
    return Array.from(allWeeks).sort((a, b) => a - b);
  };

  // Get all unique topics for a specific week across all sections
  const getAllTopicsForWeek = (week) => {
    if (!auditData?.Course_Content_Report) return [];
    
    const topicsSet = new Set();
    const topicsArray = [];
    
    Object.values(auditData.Course_Content_Report).forEach(sectionData => {
      const weekContent = getWeeklyContent(sectionData.content, week);
      weekContent.forEach(content => {
        if (content.topics) {
          content.topics.forEach(topic => {
            if (!topicsSet.has(topic.topic_name)) {
              topicsSet.add(topic.topic_name);
              topicsArray.push(topic.topic_name);
            }
          });
        }
      });
    });
    
    return topicsArray;
  };

  // Get topic status for a specific teacher and topic
  const getTopicStatusForTeacher = (sectionName, week, topicName) => {
    if (!auditData?.Course_Content_Report || !auditData.Course_Content_Report[sectionName]) {
      return 'Not Covered';
    }
    
    const weekContent = getWeeklyContent(auditData.Course_Content_Report[sectionName].content, week);
    
    for (const content of weekContent) {
      if (content.topics) {
        const topic = content.topics.find(t => t.topic_name === topicName);
        if (topic) {
          return topic.status;
        }
      }
    }
    
    return 'Not Available';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#FF5722';
    return '#F44336';
  };

  const ProgressBar = ({ percentage, color, label, stats }) => (
    <View style={styles.overallProgressItem}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressStats}>{stats}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: color }]} />
        <Text style={styles.progressText}>{percentage}%</Text>
      </View>
    </View>
  );

  // Topics Comparison Table Component
  const TopicsComparisonTable = ({ week }) => {
    const topics = getAllTopicsForWeek(week);
    const sections = Object.keys(auditData?.Course_Content_Report || {});
    
    if (topics.length === 0) {
      return (
        <View style={styles.noTopicsContainer}>
          <Text style={styles.noTopicsText}>No topics available for Week {week}</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Week {week} Topics Comparison</Text>
        
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={styles.topicNameHeader}>
            <Text style={styles.headerText}>Topic Name</Text>
          </View>
          {sections.map((sectionName) => (
            <View key={sectionName} style={styles.teacherHeader}>
              <Text style={styles.headerText} numberOfLines={2}>
                {auditData.Course_Content_Report[sectionName].teacher_name}
              </Text>
              <Text style={styles.sectionText} numberOfLines={1}>
                ({sectionName})
              </Text>
            </View>
          ))}
        </View>

        {/* Table Body */}
        <ScrollView style={styles.tableBody} nestedScrollEnabled={true}>
          {topics.map((topicName, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <View style={styles.topicNameCell}>
                <Text style={styles.topicNameText} numberOfLines={3}>
                  {topicName}
                </Text>
              </View>
              {sections.map((sectionName) => {
                const status = getTopicStatusForTeacher(sectionName, week, topicName);
                return (
                  <View key={sectionName} style={styles.statusCell}>
                    <View style={[
                      styles.statusIndicator,
                      status === 'Covered' ? styles.coveredIndicator : 
                      status === 'Not-Covered' ? styles.notCoveredIndicator : styles.notAvailableIndicator
                    ]}>
                      <Text style={styles.statusSymbol}>
                        {status === 'Covered' ? '✓' : 
                         status === 'Not Covered' ? '✗' : '-'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, styles.coveredIndicator]} />
            <Text style={styles.legendText}>Covered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendIndicator, styles.notCoveredIndicator]} />
            <Text style={styles.legendText}>Not Covered</Text>
          </View>
        </View>
      </View>
    );
  };

  // New Tasks Comparison Table Component
  const TasksComparisonTable = () => {
    const taskSections = Object.entries(auditData.Task_Report || {});
    
    if (taskSections.length === 0) {
      return (
        <View style={styles.noTopicsContainer}>
          <Text style={styles.noTopicsText}>No tasks data available</Text>
        </View>
      );
    }

    // Get all unique task types
    const allTaskTypes = new Set();
    taskSections.forEach(([, sectionData]) => {
      Object.keys(sectionData.tasks || {}).forEach(taskType => {
        allTaskTypes.add(taskType);
      });
    });
    const taskTypes = Array.from(allTaskTypes).sort();

    return (
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Tasks Progress Comparison</Text>
        
        {/* Table Header */}
        <View style={styles.tasksTableHeader}>
          <View style={styles.taskTypeHeader}>
            <Text style={styles.headerText}>Task Type</Text>
          </View>
          {taskSections.map(([sectionName, sectionData]) => (
            <View key={sectionName} style={styles.teacherTaskHeader}>
              <Text style={styles.headerText} numberOfLines={2}>
                {sectionData.name}
              </Text>
              <Text style={styles.sectionText} numberOfLines={1}>
                ({sectionName})
              </Text>
            </View>
          ))}
        </View>

        {/* Table Body */}
        <ScrollView style={styles.tableBody} nestedScrollEnabled={true}>
          {taskTypes.map((taskType, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <View style={styles.taskTypeCell}>
                <Text style={styles.taskTypeText} numberOfLines={2}>
                  {taskType}
                </Text>
              </View>
              {taskSections.map(([sectionName, sectionData]) => {
                const taskData = sectionData.tasks?.[taskType];
                if (!taskData) {
                  return (
                    <View key={sectionName} style={styles.taskDataCell}>
                      <Text style={styles.noDataText}>-</Text>
                    </View>
                  );
                }
                
                const percentage = taskData.limit ? 
                  Math.min((taskData.total_count / taskData.limit) * 100, 100) : 100;
                
                return (
                  <View key={sectionName} style={styles.taskDataCell}>
                    <Text style={styles.taskCountText}>
                      {taskData.total_count}/{taskData.limit || '∞'}
                    </Text>
                    {taskData.limit && (
                      <View style={styles.taskProgressContainer}>
                        <View 
                          style={[
                            styles.taskProgressBar, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: getProgressColor(percentage)
                            }
                          ]} 
                        />
                      </View>
                    )}
                    <View style={styles.taskBreakdownSmall}>
                      <Text style={styles.breakdownSmallText}>T: {taskData.ByTeacher}</Text>
                      <Text style={styles.breakdownSmallText}>J: {taskData.ByJunior}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

    
        <View style={styles.tasksLegend}>
        
          <Text style={styles.legendDescription}>T = By Teacher, J = By Junior</Text>
        </View>
      </View>
    );
  };

  const WeekDropdown = () => (
    <Modal
      visible={showWeekDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowWeekDropdown(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setShowWeekDropdown(false)}
      >
        <View style={styles.dropdownModal}>
          <Text style={styles.dropdownTitle}>Select Week</Text>
          <ScrollView style={styles.weekList} showsVerticalScrollIndicator={false}>
            {getAvailableWeeks().map(week => (
              <TouchableOpacity
                key={week}
                style={[styles.weekItem, selectedWeek === week && styles.selectedWeekItem]}
                onPress={() => {
                  setSelectedWeek(week);
                  setShowWeekDropdown(false);
                }}
              >
                <Text style={[styles.weekText, selectedWeek === week && styles.selectedWeekText]}>
                  Week {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Course Audit"
          userName={userData.name}
          des="Teacher"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          onLogout={() => navigation.replace('Login')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading audit data...</Text>
        </View>
      </View>
    );
  }

  if (!auditData) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Course Audit"
          userName={userData.name}
          des="Teacher"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          onLogout={() => navigation.replace('Login')}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load audit data</Text>
        </View>
      </View>
    );
  }

  const courseContentSections = Object.entries(auditData.Course_Content_Report || {});

  return (
    <View style={styles.container}>
      <Navbar
        title="Course Audit"
        userName={userData.name}
        des="Teacher"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Course Info */}
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{auditData.Course_Info?.['Course Name']}</Text>
          <Text style={styles.sessionInfo}>
            {auditData.Course_Info?.['Session Name']} • 
            Lab: {auditData.Course_Info?.['Course_Has_Lab']}
          </Text>
        </View>

        {/* Overall Progress Bars */}
        <View style={styles.overallProgressSection}>
          <Text style={styles.sectionTitle}>Overall Progress Comparison</Text>
          {courseContentSections.map(([sectionName, sectionData]) => {
            const progress = calculateOverallProgress(sectionData.content);
            return (
              <ProgressBar
                key={sectionName}
                percentage={progress.percentage}
                color={getProgressColor(progress.percentage)}
                label={`${sectionName} - ${sectionData.teacher_name}`}
                stats={`${progress.covered}/${progress.total} topics`}
              />
            );
          })}
        </View>

        {/* Week Selection */}
        <View style={styles.weekSelectionSection}>
          <Text style={styles.sectionTitle}>Weekly Topics Comparison</Text>
          <TouchableOpacity 
            style={styles.weekSelector}
            onPress={() => setShowWeekDropdown(true)}
          >
            <Text style={styles.weekSelectorText}>Week {selectedWeek}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Topics Comparison Table */}
        <TopicsComparisonTable week={selectedWeek} />

        {/* Tasks Comparison Table */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks Progress Comparison</Text>
          <TasksComparisonTable />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <WeekDropdown />
    </View>
  );
};

export default Audit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  
  // Course Info
  courseInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sessionInfo: {
    fontSize: 16,
    color: '#7f8c8d',
  },

  // Section Titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginVertical: 16,
    marginLeft: 4,
  },

  // Overall Progress
  overallProgressSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overallProgressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  progressStats: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  progressBarContainer: {
    height: 32,
    backgroundColor: '#ecf0f1',
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },

  // Week Selection
  weekSelectionSection: {
    marginBottom: 20,
  },
  weekSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weekSelectorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#7f8c8d',
  },

  // Table Styles (Topics)
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 16,
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    borderBottomWidth: 2,
    borderBottomColor: '#2c3e50',
  },
  topicNameHeader: {
    flex: 2,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#2c3e50',
    justifyContent: 'center',
  },
  teacherHeader: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#2c3e50',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  headerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionText: {
    color: '#bdc3c7',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    minHeight: 50,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f8f9fa',
  },
  topicNameCell: {
    flex: 2,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    justifyContent: 'center',
  },
  topicNameText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 18,
  },
  statusCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  coveredIndicator: {
    backgroundColor: '#27ae60',
  },
  notCoveredIndicator: {
    backgroundColor: '#B33F32',
  },
  notAvailableIndicator: {
    backgroundColor: '#95a5a6',
  },
  statusSymbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#2c3e50',
  },
  noTopicsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  noTopicsText: {
    fontSize: 19,
    color: '#95a5a6',
    fontStyle: 'italic',
  },

  // Tasks Table Styles
  tasksTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2980b9',
    borderBottomWidth: 2,

    borderBottomColor: '#1f618d',
  },
  taskTypeHeader: {
    flex: 1.5,
    padding: 1,
    borderRightWidth: 1,
    borderRightColor: '#1f618d',
    justifyContent: 'center',
  },
  teacherTaskHeader: {
    flex: 1,
  
    borderRightWidth: 1,
    borderRightColor: '#1f618d',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  taskTypeCell: {
    flex: 1.5,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    justifyContent: 'center',
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    lineHeight: 18,
  },
  taskDataCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCountText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 4,
  },
  noDataText: {
    fontSize: 16,
    color: '#95a5a6',
    fontWeight: 'bold',
  },
  taskProgressContainer: {
    width: '90%',
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginBottom: 4,
  },
  taskProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  taskBreakdownSmall: {
    alignItems: 'center',
  },
  breakdownSmallText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  tasksLegend: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  legendDescription: {
    fontSize: 13,
    color: '#7f8c8d',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  weekList: {
    maxHeight: 300,
  },
  weekItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedWeekItem: {
    backgroundColor: '#3498db',
  },
  weekText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  selectedWeekText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Tasks Section
  tasksSection: {
    marginBottom: 20,
  },

  bottomPadding: {
    height: 20,
  },
});