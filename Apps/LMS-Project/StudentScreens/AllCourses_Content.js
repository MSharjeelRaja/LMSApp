import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar
} from 'react-native';

const AllCourses_Content = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [showMCQsModal, setShowMCQsModal] = useState(false);
  const [currentMCQs, setCurrentMCQs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://192.168.0.153:8000/api/Hod/content');
        const result = await response.json();
        
        if (result.status) {
          setData(result.data);
          // Set the first session as default
          const sessions = Object.keys(result.data);
          if (sessions.length > 0) {
            setSelectedSession(sessions[0]);
          }
        } else {
          setError(result.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCoursePress = (courseName, courseData) => {
    setSelectedCourse({ name: courseName, data: courseData });
  };

  const handleBackToList = () => {
    setSelectedCourse(null);
  };

  const handleOpenFile = (fileUrl) => {
    if (fileUrl) {
      Linking.openURL(fileUrl).catch(err => {
        console.error("Failed to open URL:", err);
        alert('Failed to open file');
      });
    }
  };

  const handleOpenMCQs = (mcqs) => {
    setCurrentMCQs(mcqs);
    setShowMCQsModal(true);
  };

  const filteredCourses = () => {
    if (!selectedSession || !data) return [];
    
    const sessionCourses = data[selectedSession];
    const courses = Object.entries(sessionCourses);
    
    if (!searchQuery) return courses;
    
    return courses.filter(([courseName]) => 
      courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getContentTypeIcon = (type) => {
    switch(type) {
      case 'Notes': return '📝';
      case 'Quiz': return '❓';
      case 'Assignment': return '📋';
      case 'MCQS': return '✅';
      default: return '📄';
    }
  };

  const getContentTypeColor = (type) => {
    switch(type) {
      case 'Notes': return '#4CAF50';
      case 'Quiz': return '#FF9800';
      case 'Assignment': return '#2196F3';
      case 'MCQS': return '#9C27B0';
      default: return '#757575';
    }
  };

  const renderContentItem = ({ item }) => {
    const typeColor = getContentTypeColor(item.type);
    const typeIcon = getContentTypeIcon(item.type);
    
    return (
      <View style={[styles.contentCard, { borderLeftColor: typeColor }]}>
        <View style={styles.contentHeader}>
          <View style={styles.contentTypeContainer}>
            <Text style={styles.contentTypeIcon}>{typeIcon}</Text>
            <Text style={[styles.contentType, { color: typeColor }]}>{item.type}</Text>
          </View>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>Week {item.week}</Text>
          </View>
        </View>
        
        <Text style={styles.contentTitle}>{item.title}</Text>
        
        {item.type === 'MCQS' ? (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: typeColor }]}
            onPress={() => handleOpenMCQs(item.MCQS)}
          >
            <Text style={styles.actionButtonText}>View MCQs ({item.MCQS.length})</Text>
          </TouchableOpacity>
        ) : item.File ? (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: typeColor }]}
            onPress={() => handleOpenFile(item.File)}
          >
            <Text style={styles.actionButtonText}>Open {item.type}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noFileText}>No file attached</Text>
        )}
        
        {item.topics && item.topics.length > 0 && (
          <View style={styles.topicsContainer}>
            <Text style={styles.topicsTitle}>Topics covered:</Text>
            <View style={styles.topicsGrid}>
              {item.topics.map(topic => (
                <View key={topic.topic_id} style={styles.topicChip}>
                  <Text style={styles.topicText}>{topic.topic_name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading course content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Re-call fetch function
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📭</Text>
          <Text style={styles.errorText}>No data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedCourse) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.courseHeaderTitle} numberOfLines={2}>{selectedCourse.name}</Text>
        </View>
        
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {Object.entries(selectedCourse.data).map(([week, contents]) => (
            <View key={week} style={styles.weekContainer}>
              <View style={styles.weekHeaderContainer}>
                <Text style={styles.weekHeader}>Week {week}</Text>
                <Text style={styles.weekContentCount}>{contents.length} items</Text>
              </View>
              <FlatList
                data={contents}
                renderItem={renderContentItem}
                keyExtractor={(item) => item.course_content_id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ))}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showMCQsModal}
          onRequestClose={() => setShowMCQsModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Multiple Choice Questions</Text>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => setShowMCQsModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>✕</Text>
                </Pressable>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {currentMCQs.map((mcq, index) => (
                  <View key={mcq.ID} style={styles.mcqItem}>
                    <View style={styles.mcqHeader}>
                      <Text style={styles.mcqNumber}>Q{index + 1}</Text>
                      <Text style={styles.mcqPoints}>{mcq.Points} pts</Text>
                    </View>
                    <Text style={styles.mcqQuestion}>{mcq.Question}</Text>
                    <View style={styles.mcqOptionsContainer}>
                      <Text style={styles.mcqOption}>A) {mcq["Option 1"]}</Text>
                      <Text style={styles.mcqOption}>B) {mcq["Option 2"]}</Text>
                      <Text style={styles.mcqOption}>C) {mcq["Option 3"]}</Text>
                      <Text style={styles.mcqOption}>D) {mcq["Option 4"]}</Text>
                    </View>
                    <View style={styles.mcqAnswerContainer}>
                      <Text style={styles.mcqAnswerLabel}>Correct Answer:</Text>
                      <Text style={styles.mcqAnswer}>{mcq.Answer}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.header}>
        <Text style={styles.title}>📚 Course Content</Text>
        <Text style={styles.subtitle}>Browse and access your course materials</Text>
      </View>

      <View style={styles.filterContainer}>
  <TouchableOpacity 
    style={styles.sessionDropdown}
    onPress={() => setShowSessions(!showSessions)}
  >
    <Text style={styles.sessionDropdownText}>
      📅 {selectedSession || 'Select Session'}
    </Text>
    <Text style={styles.dropdownArrow}>{showSessions ? '▲' : '▼'}</Text>
  </TouchableOpacity>

  {showSessions && (
    <ScrollView style={styles.sessionList} nestedScrollEnabled={true}>
      {Object.keys(data).map(session => (
        <TouchableOpacity
          key={session}
          style={[
            styles.sessionItem,
            selectedSession === session && styles.selectedSessionItem
          ]}
          onPress={() => {
            setSelectedSession(session);
            setShowSessions(false);
          }}
        >
          <Text style={[
            styles.sessionItemText,
            selectedSession === session && styles.selectedSessionText
          ]}>{session}</Text>
          {selectedSession === session && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  )}

  <View style={styles.searchContainer}>
    <Text style={styles.searchIcon}>🔍</Text>
    <TextInput
      style={styles.searchInput}
      placeholder="Search courses..."
      placeholderTextColor="#999"
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
  </View>
</View>


      <Text style={styles.coursesHeader}>
        Available Courses ({filteredCourses().length})
      </Text>

      <FlatList
        data={filteredCourses()}
        renderItem={({ item: [courseName, courseData] }) => (
          <TouchableOpacity 
            style={styles.courseCard}
            onPress={() => handleCoursePress(courseName, courseData)}
            activeOpacity={0.7}
          >
            <View style={styles.courseCardHeader}>
              <Text style={styles.courseIcon}>🎓</Text>
              <View style={styles.courseInfo}>
                <Text style={styles.courseName} numberOfLines={2}>{courseName}</Text>
                <Text style={styles.contentCount}>
                  {Array.isArray(courseData) ? 'No content available' : `${Object.keys(courseData).length} weeks of content`}
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={([courseName]) => courseName}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No courses match your search' : 'No courses available for this session'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
  },
  sessionDropdownText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6c757d',
  },
  sessionList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 12,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  selectedSessionItem: {
    backgroundColor: '#e3f2fd',
  },
  sessionItemText: {
    fontSize: 16,
    color: '#495057',
  },
  selectedSessionText: {
    color: '#1976d2',
    fontWeight: '500',
  },
  checkmark: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#495057',
  },
  coursesHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  courseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  courseIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  contentCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  clearSearchText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  courseHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  weekContainer: {
    marginBottom: 24,
  },
  weekHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
  },
  weekContentCount: {
    fontSize: 14,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    padding: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  contentType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  weekBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weekBadgeText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 12,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  noFileText: {
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  topicsContainer: {
    marginTop: 8,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicChip: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  topicText: {
    fontSize: 12,
    color: '#495057',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#6c757d',
  },
  mcqItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  mcqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mcqNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  mcqPoints: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mcqQuestion: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 12,
    lineHeight: 22,
  },
  mcqOptionsContainer: {
    marginBottom: 12,
  },
  mcqOption: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 6,
    paddingLeft: 8,
  },
  mcqAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 8,
    borderRadius: 6,
  },
  mcqAnswerLabel: {
    fontSize: 14,
    color: '#155724',
    marginRight: 8,
  },
  mcqAnswer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
  },
});

export default AllCourses_Content;