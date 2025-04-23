import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Modal,
  FlatList,
  Dimensions,
  Linking,
  Animated,
  SectionList
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';
import { Platform, ToastAndroid } from 'react-native';
import RNFetchBlob from 'react-native-blob-util'
import { useAlert } from '../ControlsAPI/alert';


const CourseCard = ({ course, onPress, examResult }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(animatedHeight, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  };

  return (
    <View style={styles.cardContainer}>
    <TouchableOpacity style={styles.card} onPress={() => onPress(course)}>
      <View style={styles.cardHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{course.course_name}</Text>
          <Text style={styles.courseCode}>{course.course_code}</Text>
  
          {/* Show Lab Tag */}
          {course.Is === "Lab" && (
            <Text style={styles.labTag}>Lab</Text>
          )}
        </View>
  
        <View style={styles.courseDetails}>
          <Text style={styles.detailText}>Credits: {course.credit_hours}</Text>
          <Text style={styles.detailText}>Type: {course.Type}</Text>
          <Text style={styles.detailText}>Section: {course.section}</Text>
        </View>
      </View>
  
      {/* Teacher Info */}
      <View style={styles.teacherInfo}>
        {course.teacher_image ? (
          <Image 
            source={{ uri: course.teacher_image }} 
            style={styles.teacherImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{course.teacher_name?.charAt(0) || "T"}</Text>
          </View>
        )}
        <Text style={styles.teacherName}>{course.teacher_name}</Text>
      </View>
  
      {/* Junior Lecturer Info - if available */}
      {course.junior_lecturer_name && (
        <View style={styles.teacherInfo}>
         
          {course.junior_image ? (
            <Image 
              source={{ uri: course.junior_image }} 
              style={styles.teacherImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>{course.junior_lecturer_name?.charAt(0) || "J"}</Text>
            </View>
          )}
          <Text style={styles.teacherName}>JL {course.junior_lecturer_name}</Text>
        </View>
      )}
    </TouchableOpacity>
  
    {/* Exam Results Toggle */}
    <TouchableOpacity style={styles.examButton} onPress={toggleExpand}>
      <Text style={styles.examButtonText}>Exam Results</Text>
      <Text style={styles.examButtonIcon}>{expanded ? "▲" : "▼"}</Text>
    </TouchableOpacity>
  
    <Animated.View style={[styles.examResultsContainer, {
      maxHeight: animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 200]
      })
    }]}>
      {examResult ? (
        <View style={styles.examResultContent}>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Total Marks:</Text>
            <Text style={styles.examValue}>{examResult.total_marks}</Text>
          </View>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Obtained:</Text>
            <Text style={styles.examValue}>{examResult.obtained_marks}</Text>
          </View>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Solid Marks:</Text>
            <Text style={styles.examValue}>{examResult.solid_marks}</Text>
          </View>
          <View style={styles.examRow}>
            <Text style={styles.examLabel}>Equivalent:</Text>
            <Text style={styles.examValue}>{examResult.solid_marks_equivalent}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noExamData}>No exam results available</Text>
      )}
    </Animated.View>
  </View>
  
  );
};



















// -------------------- course content item --------------------
// This component is used to display each item in the course content list
// It includes the title, type, week, topics, and a download button if applicable

const CourseContentItem = ({ item, onDownload }) => {
   const alertContext = useAlert() // Get alert context for notifications
 
  const handleFileDownload = async (url, fileName) => {
    if (!url) {
      alertContext.showAlert('error', 'Invalid file URL', 'Download Error');
      return;
    }
   alertContext.showAlert('info', 'Starting download...', 'Transcript', 3000);
        
    try {
      const downloadDir = RNFetchBlob.fs.dirs[Platform.OS === 'android' ? 'DownloadDir' : 'DocumentDir'];
      const fileExt = url.split('.').pop().toLowerCase() || 'file';
      const cleanName = `${fileName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;

      const config = {
        fileCache: false,
        path: `${downloadDir}/${cleanName}.${fileExt}`,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: fileName,
          description: 'File download',
          mime: 'application/octet-stream'
        }
      };

      alertContext.showAlert('info', 'Starting download...', 'File Download');
     
      const response = await RNFetchBlob.config(config)
        .fetch('GET', url)
        .progress((received, total) => {
          console.log(`Download progress: ${Math.round((received / total) * 100)}%`);
        });

      // Verify file existence
      const fileExists = await RNFetchBlob.fs.exists(response.path());
      if (fileExists) {
        alertContext.showAlert('success', 'File downloaded successfully!');
        Platform.OS === 'android' && 
          ToastAndroid.show('File saved to Downloads', ToastAndroid.LONG);
      } else {
        alertContext.showAlert('error', 'Failed to save file', 'Download Error');
      }

    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error.message.includes('network') 
        ? 'Check your internet connection' 
        : error.message.includes('ENOENT')
        ? 'Storage access denied'
        : 'Download failed';
      alertContext.showAlert('error', errorMessage, 'Download Error');
    }
  };
  const renderTopics = () => {
    if (!item.topics || !Array.isArray(item.topics) || item.topics.length === 0) {
      return null;
    }

    return (
      <View style={styles.topicsContainer}>
        <Text style={styles.topicsHeader}>Topics:</Text>
        {item.topics.map((topic, index) => {
          const topicText =
            typeof topic === 'object' && topic !== null
              ? topic.topic_name || topic.topic || JSON.stringify(topic).slice(0, -devel50)
              : topic;

          return (
            <Text key={index} style={styles.topicItem}>• {topicText}</Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.contentItem}>
      <View style={styles.contentItemHeader}>
        <View style={styles.contentTypeIcon}>
          <Text style={styles.contentTypeIconText}>
            {item.type === 'Notes'
              ? '📝'
              : item.type === 'Assignment'
              ? '📋'
              : item.type === 'Quiz'
              ? '❓'
              : item.type === 'MCQS'
              ? '🔍'
              : '📄'}
          </Text>
        </View>
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{item.title}</Text>
          <Text style={styles.contentType}>
            Week {item.week} • {item.type}
          </Text>
        </View>
      </View>

      {renderTopics()}

      {item.File && (
     <TouchableOpacity
     style={styles.downloadButton}
     onPress={() => handleFileDownload(item.File, item.title)}
   >
     <Text style={styles.buttonText}>📥 Download {item.type}</Text>
   </TouchableOpacity>
      )}
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
    PreviousCourses: {}
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeOption, setActiveOption] = useState('content');
  const [courseContent, setCourseContent] = useState({
    Active: [],
    Previous: []
  });
  const [examResults, setExamResults] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourses(),
        fetchExamResults()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Students/getAllEnrollments?student_id=${userData.id}`);
      const data = await response.json();
      console.log('Course data fetched:', data);
      if (data.success === 'Fetcehd Successfully !' || data.status === 'success') {
        setCourses({
          CurrentCourses: data.CurrentCourses || [],
          PreviousCourses: data.PreviousCourses || {}
        });
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      throw new Error('Failed to fetch courses');
    }
  };

  const fetchCourseContent = async (course) => {
    setContentLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/Students/getStudentCourseContent?student_id=${userData.id}&offered_course_id=${course.offered_course_id || course.teacher_offered_course_id}`
      );
      const data = await response.json();
      console.log('Course content data:', data);
      if (data.success === 'success') {
        setCourseContent(data.data || { Active: [], Previous: [] });
      }
    } catch (err) {
      console.error('Error fetching course content:', err);
      setError('Failed to load course content');
    } finally {
      setContentLoading(false);
    }
  };

  const fetchExamResults = async () => {
    setExamLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Students/exam-result?student_id=${userData.id}`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Exam results data:', data);
      if (data.status === 'success') {
        setExamResults(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching exam results:', err);
      setError('Failed to load exam results');
    } finally {
      setExamLoading(false);
    }
  };

  const handleCourseClick = async (course) => {
    console.log('Course clicked:', course);
    setSelectedCourse(course);
    setModalVisible(true);
    setActiveOption('content');
    await fetchCourseContent(course);
  };

  const handleOptionChange = (option) => {
    setActiveOption(option);
  };

  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      Linking.openURL(fileUrl);
    }
  };

  const getExamResultForCourse = (course) => {
    if (!examResults || examResults.length === 0) return null;
    return examResults.find(result => 
      result.course_name === course.course_name && 
      result.section === course.section
    );
  };

  const organizePreviousCourses = () => {
    const sections = [];
    if (!courses.PreviousCourses) return sections;
    
    Object.keys(courses.PreviousCourses).forEach(semester => {
      if (Array.isArray(courses.PreviousCourses[semester]) && courses.PreviousCourses[semester].length > 0) {
        sections.push({
          title: semester,
          data: courses.PreviousCourses[semester]
        });
      }
    });
    
    return sections;
  };

  const organizeContentByWeek = () => {
    if (!selectedCourse || !courseContent.Active) return {};
    
    const activeCourse = courseContent.Active.find(course => 
      course.course_name === selectedCourse.course_name
    );
    
    if (!activeCourse || !activeCourse.course_content) return {};
    
    const weeklyContent = {};
    Object.keys(activeCourse.course_content).forEach(weekNumber => {
      const weekItems = activeCourse.course_content[weekNumber];
      if (Array.isArray(weekItems) && weekItems.length > 0) {
        weeklyContent[weekNumber] = weekItems;
      }
    });
    
    return weeklyContent;
  };

  const renderWeekSelector = (weeklyContent) => {
    const weeks = Object.keys(weeklyContent).sort((a, b) => parseInt(a) - parseInt(b));
    if (weeks.length === 0) return null;
    
    // Set default selected week if none is selected
    if (!selectedWeek && weeks.length > 0) {
      setSelectedWeek(weeks[0]);
    }
    
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekSelectorContainer}
      >
        {weeks.map((week) => (
          <TouchableOpacity
            key={week}
            style={[
              styles.weekItem,
              selectedWeek === week && styles.selectedWeekItem
            ]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text 
              style={[
                styles.weekText,
                selectedWeek === week && styles.selectedWeekText
              ]}
            >
              Week {week}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderCurrentCourses = () => {
    return (
      <FlatList
        data={courses.CurrentCourses}
        keyExtractor={(item, index) => `current-${item.offered_course_id || index}`}
        renderItem={({ item }) => (
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
        renderItem={({ item }) => (
          <CourseCard 
            course={item} 
            onPress={handleCourseClick}
            examResult={getExamResultForCourse(item)}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
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

  const renderModalContent = () => {
    if (contentLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const weeklyContent = organizeContentByWeek();
    const weeks = Object.keys(weeklyContent);

    if (weeks.length === 0) {
      return (
        <View style={styles.noContentContainer}>
          <Text style={styles.noContentText}>No content available for this course</Text>
        </View>
      );
    }

    const currentWeekContent = weeklyContent[selectedWeek || weeks[0]] || [];

    return (
      <View style={styles.modalContentContainer}>
        {renderWeekSelector(weeklyContent)}
        
        <FlatList
          data={currentWeekContent}
          keyExtractor={(item, index) => `content-${item.course_content_id || index}`}
          renderItem={({ item }) => (
            <CourseContentItem 
              item={item} 
              onDownload={handleDownload}
            />
          )}
          contentContainerStyle={styles.contentList}
        />
      </View>
    );
  };

  console.log('Rendering courses component, loading:', loading, 'current courses:', courses.CurrentCourses?.length);

  return (
    <View style={styles.container}>
      <Navbar title="My Courses" navigation={navigation} />
      
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
              onPress={() => setActiveTab('current')}
            >
              <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
                Current Courses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'previous' && styles.activeTab]} 
              onPress={() => setActiveTab('previous')}
            >
              <Text style={[styles.tabText, activeTab === 'previous' && styles.activeTabText]}>
                Previous Courses
              </Text>
            </TouchableOpacity>
          </View>
          
          {activeTab === 'current' ? renderCurrentCourses() : renderPreviousCourses()}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCourse?.course_name}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedCourse?.course_code} • {selectedCourse?.section}
            </Text>
          </View>
          
          {renderModalContent()}
        </View>
      </Modal>
    </View>
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
  },labTag: {
    backgroundColor: "#f39c12",
    color: "#fff",
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    backgroundColor: colors.primary || '#2196f3',
    padding: 15,
    paddingTop: 40,
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  modalContentContainer: {
    flex: 1,
  },
  weekSelectorContainer: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  weekItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    elevation: 1,
  },
  selectedWeekItem: {
    backgroundColor: colors.primary || '#2196f3',
  },
  weekText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedWeekText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  contentList: {
    padding: 15,
  },
  contentItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  contentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentTypeIcon: {
    marginRight: 10,
  },
  contentTypeIconText: {
    fontSize: 22,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  contentType: {
    fontSize: 13,
    color: '#666666',
  },
  topicsContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  topicsHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333333',
  },
  topicItem: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 3,
    paddingLeft: 5,
  },
  downloadButton: {
    backgroundColor: colors.green2 || '#4caf50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 5,
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noContentText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default Courses;