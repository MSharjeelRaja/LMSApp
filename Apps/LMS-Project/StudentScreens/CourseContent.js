import React, { useEffect, useState } from "react";
import {
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  PermissionsAndroid, 
  Platform, 
  Alert,
  StatusBar
} from "react-native";
import { DataTable } from "react-native-paper";
import { SelectList } from "react-native-dropdown-select-list";
import CheckBox from "@react-native-community/checkbox";
import { Navbar } from "../ControlsAPI/Comps";
import RNFS from "react-native-fs";
import RNFetchBlob from "react-native-blob-util";
import Icon from "react-native-vector-icons/MaterialIcons";

import { API_URL } from "../ControlsAPI/Comps";

// Modern color palette
const COLORS = {
  primary: "#2563eb",       // Blue-600
  primaryDark: "#1d4ed8",   // Blue-700
  primaryLight: "#dbeafe",  // Blue-100
  secondary: "#4f46e5",     // Indigo-600
  accent: "#8b5cf6",        // Violet-500
  success: "#10b981",       // Emerald-500
  danger: "#ef4444",        // Red-500
  warning: "#f59e0b",       // Amber-500
  dark: "#1e293b",          // Slate-800
  light: "#f8fafc",         // Slate-50
  white: "#ffffff",
  gray: "#64748b",          // Slate-500
  grayLight: "#f1f5f9",     // Slate-100
  border: "#e2e8f0",        // Slate-200
};

const CourseContent = ({route, navigation}) => {
  useEffect(() => {
    console.log("CourseContent Params:", route.params);
  }, []);

  const [courseContent, setCourseContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const courseList = [
    { key: "18", value: "Compiler Construction" },
    { key: "5", value: "Programming Fundamentals" },
  ];

  const fetchCourseContent = async (courseId) => {
    if (!courseId) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/Students/course-content?offered_course_id=${courseId}&section_id=53`);
      const data = await response.json();
      console.log(data, response);

      if (data?.["Course Content"]) {
        const formattedData = Object.entries(data["Course Content"]).map(([weekNumber, contents]) => ({
          week_title: `Week ${weekNumber}`,
          items: contents.map((content) => ({
            ...content,
            topics: content.topics || [],
          })),
        }));

        setCourseContent(formattedData);
      } else {
        setCourseContent([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setCourseContent([]);
    } finally {
      setLoading(false);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission Required",
            message: "App needs access to your storage to download files.",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS doesn't need permission
  };

  const downloadFile = async (url, filename) => {
    const savePath = `${RNFS.DownloadDirectoryPath}/${filename}`; // ✅ Save to /storage/emulated/0/Download

    try {
      const res = await RNFetchBlob.config({
        path: savePath,
        fileCache: true,
        appendExt: "pdf",
        notification: true,
      }).fetch("GET", url);
      Alert.alert("Download Complete", `File saved to: ${savePath}`, [
        { text: "Open File", onPress: () => openFile(savePath) },
        { text: "OK", style: "cancel" },
      ]);
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download file.");
    }
  };

  const openFile = (filePath) => {
    RNFetchBlob.android.actionViewIntent(filePath, "application/pdf");
  };
  
  return (
    <>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Content lms</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.courseSelector}>
          <Icon name="menu-book" size={24} color={COLORS.primary} style={styles.selectorIcon} />
          <SelectList
            setSelected={(val) => {
              setSelectedCourse(val);
              fetchCourseContent(val);
            }}
            data={courseList}
            placeholder="Select a Course"
            boxStyles={styles.dropdown}
            dropdownStyles={styles.dropdownList}
            dropdownTextStyles={styles.dropdownText}
            inputStyles={styles.dropdownInput}
            search={false}
          />
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Loading course content...</Text>
          </View>
        ) : courseContent.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="folder-open" size={60} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>No content available</Text>
            <Text style={styles.emptyStateSubText}>Select a course to view its content</Text>
          </View>
        ) : (
          courseContent.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekContainer}>
              <View style={styles.weekHeaderContainer}>
                <Icon name="date-range" size={22} color={COLORS.primary} />
                <Text style={styles.weekTitle}>{week.week_title}</Text>
              </View>

              {week.items.map((item) => (
                <View key={item.course_content_id} style={styles.itemContainer}>
                  
                  {/* Notes Section */}
                  {item.type === "Notes" && (
                    <>
                      <View style={styles.itemHeader}>
                        <Icon name="description" size={20} color={COLORS.secondary} />
                        <Text style={styles.lectureTitle}>{item.title}</Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => downloadFile(item.File, item.title + ".pdf")}
                        activeOpacity={0.8}
                      >
                        <Icon name="file-download" size={18} color={COLORS.white} />
                        <Text style={styles.downloadText}>Download Notes</Text>
                      </TouchableOpacity>

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
                          
                          {item.topics.map((topic) => (
                            <DataTable.Row key={topic.topic_id} style={styles.tableRow}>
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
                    </>
                  )}

                  {/* Assignments, Quizzes */}
                  {item.type !== "Notes" && (
                    <View style={styles.otherContentContainer}>
                      <View style={styles.otherContentHeader}>
                        <Icon 
                          name={item.type === "Quiz" ? "quiz" : "assignment"} 
                          size={20} 
                          color={item.type === "Quiz" ? COLORS.accent : COLORS.warning} 
                        />
                        <Text style={[
                          styles.otherContentTitle,
                          {color: item.type === "Quiz" ? COLORS.accent : COLORS.warning}
                        ]}>
                          {item.type}
                        </Text>
                      </View>
                      <Text style={styles.otherContentText}>{item.title}</Text>
                      
                      <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity 
                          style={[
                            styles.actionButton, 
                            {backgroundColor: item.type === "Quiz" ? COLORS.accent : COLORS.warning}
                          ]} 
                          activeOpacity={0.8}
                          onPress={() => downloadFile(item.File, item.title + ".pdf")}
                        >
                          <Icon name="file-download" size={16} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>Download</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.viewDetailsButton} 
                          activeOpacity={0.8}
                        >
                          <Text style={styles.viewDetailsText}>View Details</Text>
                          <Icon name="arrow-forward" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  courseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
  },
  selectorIcon: {
    marginRight: 12,
  },
  dropdown: {
    flex: 1,
    borderWidth: 0,
    padding: 8,
    backgroundColor: 'transparent',
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: 8,
  },
  dropdownText: {
    color: COLORS.dark,
    fontSize: 14,
  },
  dropdownInput: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: '500',
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
  emptyStateSubText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  weekContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  weekHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 8,
  },
  itemContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
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
    backgroundColor: COLORS.success + '20', // 20% opacity
  },
  notCoveredBadge: {
    backgroundColor: COLORS.warning + '20', // 20% opacity
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
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  downloadText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  otherContentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  otherContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  otherContentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  otherContentText: {
    fontSize: 15,
    color: COLORS.dark,
    marginBottom: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewDetailsText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default CourseContent;