import {  
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  Linking
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Title } from "react-native-paper";
import colors from '../ControlsAPI/colors';
import { API_URL, Navbar } from '../ControlsAPI/Comps';

const CourseSections = ({ route }) => {
  const navigation = useNavigation();
  const userData = route.params?.userData || {};
  const Tid = userData.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1); // Default to week 1
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    fetchCourseContent();
  }, []);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/Teachers/get_course_content?teacher_id=${Tid}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error('Failed to fetch course content');
      }

      setCourseData(data.course_contents);
      
      // Set initial selected course
      if (data.course_contents) {
        const firstCourseId = Object.keys(data.course_contents)[0];
        setSelectedCourseId(firstCourseId);
        
        // Set initial selected section
        const firstCourse = data.course_contents[firstCourseId][0];
        if (firstCourse?.sections) {
          // Handle both array and object formats for sections
          const firstSection = Array.isArray(firstCourse.sections) 
            ? firstCourse.sections[0] 
            : firstCourse.sections[Object.keys(firstCourse.sections)[0]];
          
          setSelectedSection(firstSection);
        }
      }
    } catch (err) {
      console.error('Error fetching course content:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionPress = (section) => {
    setSelectedSection(section);
    navigation.navigate('CourseContentMarked', {
      teacherOfferedCourseId: section.teacher_offered_course_id,
      teacherId: Tid,
      teacherName: userData.name || 'Teacher',
      sectionName: section.section_name,
      courseName: section.course_name
    });
  };

  const handleCoursePress = (courseId) => {
    setSelectedCourseId(courseId);
    // Reset selected section when changing course
    const course = courseData[courseId][0];
    if (course?.sections) {
      // Handle both array and object formats for sections
      const firstSection = Array.isArray(course.sections) 
        ? course.sections[0] 
        : course.sections[Object.keys(course.sections)[0]];
      
      setSelectedSection(firstSection);
    }
    // Reset to week 1 when changing course
    setSelectedWeek(1);
  };

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.courseItem,
        selectedCourseId === item && styles.selectedCourseItem
      ]}
      onPress={() => handleCoursePress(item)}
    >
      <Text style={styles.courseText}>{courseData[item][0].course_name}</Text>
    </TouchableOpacity>
  );

  const renderSectionItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.sectionItem,
        selectedSection?.teacher_offered_course_id === item.teacher_offered_course_id && 
        styles.selectedSectionItem
      ]}
      onPress={() => handleSectionPress(item)}
    >
      <Text style={styles.sectionText}>{item.section_name}</Text>
    </TouchableOpacity>
  );

  const renderWeekItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.weekItem,
        selectedWeek === item.week && styles.selectedWeekItem
      ]}
      onPress={() => setSelectedWeek(item.week)}
    >
      <Text style={styles.weekText}>Week {item.week}</Text>
    </TouchableOpacity>
  );

  const renderContentItem = ({ item }) => (
    <View style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <Text style={styles.contentTitle}>{item.title}</Text>
        <View style={[
          styles.typeBadge,
          item.type === 'Notes' && styles.notesBadge,
          item.type === 'Assignment' && styles.assignmentBadge,
          item.type === 'Quiz' && styles.quizBadge,
        ]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>


      {item.type === 'Notes' && item.topics && (
        <View style={styles.topicsContainer}>
          <Text style={styles.subtitle}>Topics:</Text>
          {item.topics.map(topic => (
            <View key={topic.topic_id} style={styles.topicItem}>
              <Icon name="circle" size={12} color={colors.orange} />
              <Text style={styles.topicText}>{topic.topic_name}</Text>
            </View>
          ))}
          
      {item.type === 'Notes' && item.File && (
        <TouchableOpacity 
          style={styles.fileButton}
          onPress={() =>  Linking.openURL(item.File)}
        >
          <Icon name="file-download" size={18} color="white" />
          <Text style={styles.fileText}>Download File</Text>
        </TouchableOpacity>
      )}
        </View>
      )}


      {item.type === 'Assignment' && item.File && (
        <TouchableOpacity 
          style={styles.fileButton}
          onPress={() =>  Linking.openURL(item.File)}
        >
          <Icon name="file-download" size={18} color="white" />
          <Text style={styles.fileText}>Download Assignment</Text>
        </TouchableOpacity>
      )}

      {/* Handle Quizzes */}
      {item.type === 'Quiz' && item.File && Array.isArray(item.File) ? (
        <View style={styles.quizContainer}>
          <Text style={styles.subtitle}>Quiz Questions:</Text>
          {item.File.map((question, index) => (
            <View key={index} style={styles.questionCard}>
              <Text style={styles.questionText}>
                Q{question['Question NO']}: {question.Question}
              </Text>
              <View style={styles.optionsContainer}>
                <Text style={styles.optionText}>A) {question['Option 1']}</Text>
                <Text style={styles.optionText}>B) {question['Option 2']}</Text>
                {question['Option 3'] && <Text style={styles.optionText}>C) {question['Option 3']}</Text>}
                {question['Option 4'] && <Text style={styles.optionText}>D) {question['Option 4']}</Text>}
              </View>
              <Text style={styles.answerText}>Answer: {question.Answer}</Text>
            </View>
          ))}
        </View>
      ) : item.type === 'Quiz' && item.File && (
        <TouchableOpacity 
          style={styles.fileButton}
          onPress={() =>  Linking.openURL(item.File)}
        >
          <Icon name="file-download" size={18} color="white" />
          <Text style={styles.fileText}>Download Quiz</Text>
        </TouchableOpacity>
      )}
    </View>
  );



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Course Content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={50} color={colors.danger} />
        <Text style={styles.errorText}>Error loading content</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchCourseContent}
        >
          <Icon name="refresh" size={20} color="white" />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!courseData || !selectedCourseId) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="folder-off" size={50} color={colors.gray} />
        <Text style={styles.emptyText}>No course content available</Text>
      </View>
    );
  }

  const currentCourse = courseData[selectedCourseId][0];
  const sections = Array.isArray(currentCourse.sections) 
    ? currentCourse.sections 
    : Object.values(currentCourse.sections);
  
  // Extract weeks from course content
  const weeks = [];
  if (currentCourse.course_content) {
    Object.entries(currentCourse.course_content).forEach(([weekNum, content]) => {
      if (content.length > 0) {
        weeks.push({ week: parseInt(weekNum) });
      }
    });
    weeks.sort((a, b) => a.week - b.week);
  }

  return (
    <View style={styles.mainContainer}>
      <Navbar
        title={'Course Content'}
        userName={userData.name || 'Teacher'}
        des="Teacher"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Title style={styles.pageTitle}>Course Content</Title>
        </View>
        
        {/* Course Selector */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Course:</Text>
          <FlatList
            horizontal
            data={Object.keys(courseData)}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={styles.pickerList}
            showsHorizontalScrollIndicator={false}
          />
        </View>

       
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}> Section Progress :</Text>
          <FlatList
            horizontal
            data={sections}
            renderItem={renderSectionItem}
            keyExtractor={(item) => item.teacher_offered_course_id.toString()}
            contentContainerStyle={styles.pickerList}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Weeks Picker */}
        {weeks.length > 0 && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Week:</Text>
            <FlatList
              horizontal
              data={weeks}
              renderItem={renderWeekItem}
              keyExtractor={(item) => item.week.toString()}
              contentContainerStyle={styles.pickerList}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Content List */}
        <View style={styles.contentContainer}>
          {currentCourse.course_content && currentCourse.course_content[selectedWeek] ? (
            currentCourse.course_content[selectedWeek].map((item) => (
              <View key={item.course_content_id}>
                {renderContentItem({ item })}
              </View>
            ))
          ) : (
            <View style={styles.noContentContainer}>
              <Icon name="info" size={40} color={colors.info} />
              <Text style={styles.noContentText}>No content available for this week</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.primaryFaint,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  errorText: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  errorSubtext: {
    color: colors.gray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: colors.white,
    marginLeft: 8,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
    shadowColor: colors.black,
  
    elevation: 3,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.blueNavy,
    marginBottom: 12,
  },
  pickerList: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  courseItem: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
 
  courseText: {
    color: colors.blueNavy,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionItem: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
 
  sectionText: {
    color: colors.blueNavy,
    fontSize: 15,
    fontWeight: '600',
  },
  weekItem: {
    backgroundColor: colors.blueLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedWeekItem: {
    backgroundColor: colors.primary,

  },
  weekText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  contentContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  contentCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    shadowColor: colors.black,
   
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  contentTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.blueNavy,
    flex: 1,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  notesBadge: {
    backgroundColor: colors.orange,
  },
  assignmentBadge: {
    backgroundColor: colors.blueSky,
  },
  quizBadge: {
    backgroundColor: colors.red1,
  },
  typeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  topicsContainer: {
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.blueNavy,
    marginBottom: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: colors.primaryFaint,
    padding: 10,
    borderRadius: 6,
  },
  topicText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.dark,
  },
  fileButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  quizContainer: {
    marginTop: 12,
  },
  questionCard: {
    backgroundColor: colors.primaryFaint,
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  questionText: {
    fontSize: 15,
    marginBottom: 10,
    fontWeight: '500',
    color: colors.blueNavy,
  },
  optionsContainer: {
    marginBottom: 10,
    paddingLeft: 5,
  },
  optionText: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.dark,
  },
  answerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
  },
  noContentContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    shadowColor: colors.black,

    elevation: 3,
  },
  noContentText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
});

export default CourseSections;