import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
  Dimensions
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Navbar } from "../ControlsAPI/Comps";
import { API_URL } from "../ControlsAPI/Comps";
import colors from "../ControlsAPI/colors";
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const strokeDashoffset = circum - (percentage / 100) * circum;

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle
        stroke={colors.primaryLight}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      
    
      <Circle
        stroke={colors.green2}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circum} ${circum}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
      
      {/* Centered percentage text */}
      <SvgText
        x="46%"
        y="50%"
        textAnchor="middle"
        alignmentBaseline="middle"
        fill={colors.primary}
        fontSize="24"
        fontWeight="bold"
      >
        {percentage}%
      </SvgText>
    </Svg>
  );
};
const CourseContentMarked = ({ route, navigation }) => {
  const { teacherOfferedCourseId, teacherName, sectionName, courseName } = route.params;
  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coveredCount, setCoveredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCourseContent();
  }, []);

  const calculateProgress = (data) => {
    let covered = 0;
    let total = 0;

    data.forEach(week => {
      week.items.forEach(item => {
        if (item.topics) {
          total += item.topics.length;
          covered += item.topics.filter(t => t.status === "Covered").length;
        }
      });
    });

    setCoveredCount(covered);
    setTotalCount(total);
  };

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_URL}/api/Teachers/topic?teacher_offered_course_id=${teacherOfferedCourseId}`
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      if (data?.Course_Content) {
        const formattedData = Object.entries(data.Course_Content)
          .map(([weekNumber, contents]) => ({
            week: parseInt(weekNumber),
            week_title: `Week ${weekNumber}`,
            items: contents.map(content => ({
              ...content,
              type: content.type || "Notes",
              topics: content.topics || []
            }))
          }))
          .sort((a, b) => a.week - b.week);

        setCourseContent(formattedData);
        calculateProgress(formattedData);
      } else {
        setCourseContent([]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopicStatus = async (topicId, courseContentId, currentStatus) => {
    const newStatus = currentStatus === "Covered" ? "Not-Covered" : "Covered";
    const statusBoolean = newStatus === "Covered";
    
    const updatedCourseContent = courseContent.map(week => ({
      ...week,
      items: week.items.map(item => ({
        ...item,
        topics: item.topics.map(topic => 
          topic.topic_id === topicId && item.course_content_id === courseContentId
            ? { ...topic, status: newStatus }
            : topic
        )
      }))
    }));
    
    setCourseContent(updatedCourseContent);
    calculateProgress(updatedCourseContent);
  
    try {
      const response = await fetch(`${API_URL}/api/Teachers/update-course-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacher_offered_courses_id: teacherOfferedCourseId,
          topic_id: topicId,
          coursecontent_id: courseContentId,
          Status: statusBoolean
        })
      });
  
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.message || "Failed to update status");
      
      console.log("Status updated successfully:", result);
      
    } catch (err) {
      console.error("Update error:", err);
      setCourseContent(courseContent);
      calculateProgress(courseContent);
      Alert.alert("Error", err.message || "Failed to update topic status");
    }
  };

  const renderProgressWheel = () => {
    const percentage = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;
    
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Course Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressTextContainer}>
              <Text style={styles.percentageText}>{percentage}%</Text>
              <Text style={styles.progressSubText}>Completed</Text>
              <Text style={styles.topicCountText}>
                {coveredCount} of {totalCount} topics
              </Text>
            </View>
            <CircularProgress percentage={percentage} />
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.coveredStat]}>
              <Text style={[styles.statNumber, styles.coveredNumber]}>
                {coveredCount}
              </Text>
              <Text style={styles.statLabel}>Covered</Text>
            </View>

            <View style={[styles.statBox, styles.remainingStat]}>
              <Text style={[styles.statNumber, styles.remainingNumber]}>
                {totalCount - coveredCount}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderContentItem = (item) => {
    switch (item.type) {
      case "Notes":
        return (
          <View style={styles.notesContainer}>
            {item.topics.map((topic) => (
              <View key={`${item.course_content_id}-${topic.topic_id}`} style={styles.topicRow}>
                <View style={styles.topicTextContainer}>
                  <Text style={styles.topicText}>{topic.topic_name}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    topic.status === "Covered" 
                      ? styles.coveredButton 
                      : styles.notCoveredButton
                  ]}
                  onPress={() => toggleTopicStatus(
                    topic.topic_id,
                    item.course_content_id,
                    topic.status
                  )}
                >
                  <Text style={[
                    styles.statusText,
                    topic.status === "Covered" 
                      ? styles.coveredText 
                      : styles.notCoveredText
                  ]}>
                    {topic.status}
                  </Text>
                  <Icon 
                    name={topic.status === "Covered" ? "check-circle" : "cancel"} 
                    size={16} 
                    color={topic.status === "Covered" ? colors.green2 : colors.red2} 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );

    
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={40} color={colors.red2} />
        <Text style={styles.errorText}>Error loading content</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchCourseContent}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor={colors.primaryDark} />
      <Navbar
        title={`Course Progress`}
        userName={teacherName}
        des="Teacher"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.courseName}>{courseName}</Text>
          <Text style={styles.sectionName}>{sectionName}</Text>
          {renderProgressWheel()}
        </View>
        
        {courseContent.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="folder-open" size={40} color={colors.gray} />
            <Text style={styles.emptyText}>No course content available</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchCourseContent}
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          courseContent.map((week) => (
            <View key={week.week} style={styles.weekContainer}>
              <View style={styles.weekHeader}>
                <Icon name="calendar-today" size={22} color={colors.primary} />
                <Text style={styles.weekTitle}>{week.week_title}</Text>
              </View>
              
              {week.items.map((item) => (
                <View key={item.course_content_id} style={styles.itemContainer}>
                  <View style={styles.itemTitleContainer}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    
                  </View>
                  {renderContentItem(item)}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryFaint,
  },
  headerContainer: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.inactive,
  },
  courseName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.title,
    marginBottom: 4,
  },
  sectionName: {
    fontSize: 16,
    color: colors.primaryDark,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  progressSubText: {
    fontSize: 16,
    color: colors.primaryDark,
    marginBottom: 8,
  },
  topicCountText: {
    fontSize: 14,
    color: colors.gray,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 11,
  },
  statBox: {
    flex: 1,
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  coveredStat: {
    backgroundColor: colors.successLight,
    borderColor: colors.green2,
  },
  remainingStat: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.red2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  coveredNumber: {
    color: colors.green2,
  },
  remainingNumber: {
    color: colors.red2,
  },
  statLabel: {
    fontSize: 14,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryFaint,
  },
  loadingText: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.primaryFaint,
  },
  errorText: {
    fontSize: 20,
    color: colors.red2,
    fontWeight: "bold",
    marginTop: 16,
  },
  errorDetail: {
    color: colors.dark,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    marginBottom: 20,
    color: colors.gray,
    fontSize: 16,
    fontWeight: "500",
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  refreshText: {
    color: colors.white,
    fontWeight: "600",
  },
  weekContainer: {
    margin: 16,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inactive,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.title,
    marginLeft: 12,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inactive,
  },
  itemTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.title,
    flex: 1,
  },
  itemTypeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.inactive,
  },
  topicTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  topicText: {
    fontSize: 14,
    color: colors.dark,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  coveredButton: {
    backgroundColor: colors.successLight,
    borderColor: colors.green2,
    borderWidth: 1,
  },
  notCoveredButton: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.red2,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  coveredText: {
    color: colors.green4,
  },
  notCoveredText: {
    color: colors.red2,
  },
  fileCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 8,
    elevation: 1,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.title,
    marginLeft: 12,
    flex: 1,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  fileText: {
    color: colors.primary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  missingFile: {
    color: colors.gray,
    fontStyle: "italic",
    marginTop: 8,
  },
});

export default CourseContentMarked;