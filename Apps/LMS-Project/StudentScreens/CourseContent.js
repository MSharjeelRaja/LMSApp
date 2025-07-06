import React, { useEffect, useState } from "react";
import {
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  Linking
} from "react-native";
import { DataTable } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { API_URL, Navbar } from "../ControlsAPI/Comps";
import { useAlert } from "../ControlsAPI/alert";

const COLORS = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#dbeafe",
  secondary: "#4f46e5",
  accent: "#8b5cf6",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  dark: "#1e293b",
  light: "#f8fafc",
  white: "#ffffff",
  gray: "#64748b",
  grayLight: "#f1f5f9",
  border: "#e2e8f0",
};
const CourseContent = ({route, navigation}) => {
  const { offered_course_id, student_id, studentname, course } = route.params;
  const [allCourseContent, setAllCourseContent] = useState({ Active: [], Previous: [] });
  const [currentCourseContent, setCurrentCourseContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseInfo, setCourseInfo] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [isPreviousCourse, setIsPreviousCourse] = useState(false);
  const alertContext = useAlert();
  
  useEffect(() => {
    if (offered_course_id && student_id) {
      fetchCourseContent();
    }
  }, [offered_course_id, student_id]);

  const fetchCourseContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/Students/getStudentCourseContent?student_id=${student_id}&offered_course_id=${offered_course_id}`
      );
      const data = await response.json();
      
      if (data.success === "success") {
        setAllCourseContent({
          Active: data.data.Active || [],
          Previous: data.data.Previous || []
        });
        
        // First try to find the course in Active courses
        let selectedCourse = data.data.Active?.find(c => c.course_name === course);
        let courseIsPrevious = false;
        
        // If not found in Active, try Previous courses
        if (!selectedCourse && data.data.Previous) {
          selectedCourse = data.data.Previous.find(c => c.course_name === course);
          courseIsPrevious = true;
        }
        
        if (selectedCourse) {
          setIsPreviousCourse(courseIsPrevious);
          setCourseInfo({
            name: selectedCourse.course_name,
            session: selectedCourse.session,
            section: selectedCourse.Section,
            teacher: selectedCourse.teacher_name,
            isPrevious: courseIsPrevious
          });

          const formattedData = Object.entries(selectedCourse.course_content).map(([weekNumber, contents]) => ({
            week_number: parseInt(weekNumber),
            week_title: `Week ${weekNumber}`,
            items: contents.map(content => ({
              ...content,
              topics: content.topics || [],
              MCQS: content.MCQS || []
            })),
          }));

          setCurrentCourseContent(formattedData);
          setWeeks(formattedData.map(week => ({
            number: week.week_number,
            title: week.week_title
          })));
          
          if (formattedData.length > 0) {
            setSelectedWeek(formattedData[0].week_number);
          }
        } else {
          setCurrentCourseContent([]);
          setWeeks([]);
        }
      } else {
        setAllCourseContent({ Active: [], Previous: [] });
        setCurrentCourseContent([]);
        setWeeks([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setAllCourseContent({ Active: [], Previous: [] });
      setCurrentCourseContent([]);
      setWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = (fileUrl) => {
    if (fileUrl) {
      Linking.openURL(fileUrl).catch(err => {
        console.error("Failed to open URL:", err);
        alertContext.showAlert('error', 'Failed to open file', 'Please try again');
      });
    } else {
      alertContext.showAlert('error', 'No file available', 'File Error');
    }
  };

  const renderMCQS = (mcqs) => {
    return (
      <View style={styles.mcqsContainer}>
        {mcqs.map((mcq, index) => (
          <View key={mcq.ID} style={styles.mcqItem}>
            <Text style={styles.mcqQuestion}>
              {mcq["Question NO"]}. {mcq.Question} ({mcq.Points} points)
            </Text>
            <View style={styles.optionsContainer}>
              <Text style={styles.optionText}>1. {mcq["Option 1"]}</Text>
              <Text style={styles.optionText}>2. {mcq["Option 2"]}</Text>
              <Text style={styles.optionText}>3. {mcq["Option 3"]}</Text>
              <Text style={styles.optionText}>4. {mcq["Option 4"]}</Text>
            </View>
            <Text style={styles.correctAnswer}>
              Correct Answer: ****
              {/* {mcq.Answer} */}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderWeekItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.weekTab,
        selectedWeek === item.number && styles.selectedWeekTab
      ]}
      onPress={() => setSelectedWeek(item.number)}
    >
      <Text style={[
        styles.weekTabText,
        selectedWeek === item.number && styles.selectedWeekTabText
      ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!selectedWeek) return null;
    
    const weekData = currentCourseContent.find(w => w.week_number === selectedWeek);
    if (!weekData) return null;

    return (
      <View style={styles.weekContentContainer}>
       
        
        {weekData.items.map((item) => (
          <View key={item.course_content_id} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <Icon 
                name={
                  item.type === "Notes" ? "description" : 
                  item.type === "Quiz" ? "quiz" : 
                  item.type === "MCQS" ? "question-answer" : 
                  "assignment"
                } 
                size={20} 
                color={
                  item.type === "Notes" ? COLORS.secondary : 
                  item.type === "Quiz" ? COLORS.accent : 
                  item.type === "MCQS" ? COLORS.success : 
                  COLORS.warning
                } 
              />
              <Text style={styles.lectureTitle}>{item.title}</Text>
            </View>

            {item.type === "Notes" && (
              <>
                {item.topics.length > 0 && (
                  <View style={styles.tableContainer}>
                    <DataTable style={styles.dataTable}>
                      <DataTable.Header style={styles.tableHeader}>
                        <DataTable.Title style={styles.topicColumn}>
                          <Text style={styles.tableHeaderText}>Topic</Text>
                        </DataTable.Title>
                        <DataTable.Title style={styles.statusColumn}>
                          <Text style={styles.tableHeaderText}>Status</Text>
                        </DataTable.Title>
                      </DataTable.Header>
                      
                      {item.topics.map((topic, index) => (
                        <DataTable.Row key={index} style={styles.tableRow}>
                          <DataTable.Cell style={styles.topicColumn}>
                            <Text style={styles.topicText}>{topic.topic_name}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.statusColumn}>
                            <View style={[
                              styles.statusBadge,
                              topic.status === "Covered" ? styles.coveredBadge : styles.notCoveredBadge
                            ]}>
                              <Text style={[
                                styles.statusText,
                                topic.status === "Covered" ? styles.coveredText : styles.notCoveredText
                              ]}>
                                {topic.status}
                              </Text>
                            </View>
                          </DataTable.Cell>
                        </DataTable.Row>
                      ))}
                    </DataTable>
                  </View>
                )}
                {item.File && (
                  <TouchableOpacity
                    style={[
                      styles.downloadButton,
                      { backgroundColor: COLORS.secondary }
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleOpenFile(item.File)}
                  >
                    <Icon name="open-in-browser" size={18} color={COLORS.white} />
                    <Text style={styles.downloadText}>View Notes</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {item.type === "MCQS" && item.MCQS.length > 0 && (
              renderMCQS(item.MCQS)
            )}

            {(item.type === "Assignment" || item.type === "Quiz"|| item.type === "LabTask") && item.File && (
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { 
                    backgroundColor: item.type === "Quiz" ? COLORS.accent : COLORS.warning
                  }
                ]}
                activeOpacity={0.8}
                onPress={() => handleOpenFile(item.File)}
              >
                <Icon name="open-in-browser" size={18} color={COLORS.white} />
                <Text style={styles.downloadText}>View {item.type}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };


  return (
    <>
      <Navbar
        title={course}
        userName={studentname}
        des={'Student'}
        onLogout={() => navigation.replace('Login')}
        showBackButton={true}
        onBack={() => navigation.goBack()}
      />
      
      {courseInfo && (
        <View style={styles.courseInfoContainer}>
          <Text style={styles.courseName}>{courseInfo.name}</Text>
          <View style={styles.courseMeta}>
            <Text style={styles.courseMetaText}>{courseInfo.session}</Text>
            <Text style={styles.courseMetaText}>Section: {courseInfo.section}</Text>
            <Text style={styles.courseMetaText}>Teacher: {courseInfo.teacher}</Text>
             {isPreviousCourse && (
          <View style={{display:'flex',gap:2,flexDirection:'row'}}>
            <Icon name="info" size={18} color={COLORS.warning} />
            <Text style={{color:'black'}}>This is a previous course</Text>
          </View>
        )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading course content...</Text>
        </View>
      ) : weeks.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="folder-open" size={60} color={COLORS.gray} />
          <Text style={styles.emptyStateText}>No content available</Text>
        </View>
      ) : (
        <>
          <View style={styles.weekSelectorContainer}>
            <FlatList
              horizontal
              data={weeks}
              renderItem={renderWeekItem}
              keyExtractor={item => item.number.toString()}
              contentContainerStyle={styles.weekList}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          <ScrollView style={styles.container}>
            {renderContent()}
          </ScrollView>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  courseInfoContainer: {
    backgroundColor: COLORS.white,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  courseName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  courseMetaText: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 16,
    marginBottom: 4,
  },
  loaderContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: 16,
  },
  weekSelectorContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    elevation: 2,
  },
  weekList: {
    paddingHorizontal: 16,
  },
  weekTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
  },
  selectedWeekTab: {
    backgroundColor: COLORS.primary,
  },
  weekTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
  },
  selectedWeekTabText: {
    color: COLORS.white,
  },
  weekContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 8,
    flex: 1,
  },
  tableContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dataTable: {
    backgroundColor: COLORS.white,
  },
  tableHeader: {
    backgroundColor: COLORS.grayLight,
  },
  tableHeaderText: {
    color: COLORS.dark,
    fontWeight: '600',
    fontSize: 14,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topicColumn: {
    flex: 2.5,
    paddingLeft: 8,
  },
  topicText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  statusColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coveredBadge: {
    backgroundColor: COLORS.success + '20',
  },
  notCoveredBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coveredText: {
    color: COLORS.success,
  },
  notCoveredText: {
    color: COLORS.warning,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  downloadText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  mcqsContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  mcqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mcqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  optionsContainer: {
    marginLeft: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 4,
  },
  correctAnswer: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 8,
  },
});

export default CourseContent;