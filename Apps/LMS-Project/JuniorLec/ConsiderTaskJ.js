import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAlert } from '../ControlsAPI/alert';
import { API_URL, Navbar } from '../ControlsAPI/Comps';

const ConsiderTaskJ = ({ route,navigation}) => {
  const alertContext = useAlert();
      const userData = route.params.userData;
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    Quiz: { Teacher: '', 'Junior Lecturer': '' },
    Assignment: { Teacher: '', 'Junior Lecturer': '' },
    LabTask: { Teacher: '', 'Junior Lecturer': '' }
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/JuniorLec/your-courses?teacher_id=${userData.id}`
        );
        const data = await response.json();

        if (data.status === 'success') {
          setCourses(data.data.active_courses);
        } else {
          alertContext.showAlert('error', 'Failed to fetch courses');
        }
      } catch (err) {
        alertContext.showAlert('error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseSelect = async (course) => {
    if (selectedCourse?.teacher_offered_course_id === course.teacher_offered_course_id) {
      setSelectedCourse(null);
      setSummary(null);
      return;
    }

    setSelectedCourse(course);
    setLoading(true);
    
    try {
      const response = await fetch(
          `${API_URL}/api/Teachers/summary?teacher_offered_course_id=${course.teacher_offered_course_id}`
      );
      const data = await response.json();
              console.log(data)
      if (data.status === 'success' && data.summary) {
        setSummary(data.summary);
        const newFormData = {
          Quiz: { 
            Teacher: data.summary.Quiz?.Teacher?.toString() || '0',
            'Junior Lecturer': data.summary.Quiz?.['Junior Lecturer']?.toString() || '0' 
          },
          Assignment: { 
            Teacher: data.summary.Assignment?.Teacher?.toString() || '0',
            'Junior Lecturer': data.summary.Assignment?.['Junior Lecturer']?.toString() || '0' 
          }
        };

        // Only add LabTask if it exists in the summary
        if (data.summary.LabTask) {
          newFormData.LabTask = { 
            Teacher: data.summary.LabTask?.Teacher?.toString() || '0',
            'Junior Lecturer': data.summary.LabTask?.['Junior Lecturer']?.toString() || '0' 
          };
        }

        setFormData(newFormData);
      } else {
        setFormData({
          Quiz: { Teacher: '0', 'Junior Lecturer': '0' },
          Assignment: { Teacher: '0', 'Junior Lecturer': '0' }
          // LabTask intentionally omitted
        });
        setSummary(null);
      }
    } catch (err) {
      alertContext.showAlert('error', 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCard = (title, data) => {
    if (!data) return null;
    
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Total:</Text>
          <Text style={styles.cardValue}>{data.Total || 0}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Teacher:</Text>
          <Text style={styles.cardValue}>{data.Teacher || 0}</Text>
        </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Junior Lecturer:</Text>
            <Text style={styles.cardValue}>{data['Junior Lecturer'] || 0}</Text>
          </View>
      
      </View>
    );
  };

  return (
    <View style={styles.container}>
              <Navbar 
                title="Considered Tasks" 
                userName={userData.name||classData.name} 
                des={'Junior Lecturer'} 
                         showBackButton={true}
                onLogout={() => navigation.replace('Login')}
              />
   
      {loading && !selectedCourse ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesContainer}>
          {courses.map((course) => (
            <TouchableOpacity
              key={course.teacher_offered_course_id}
              style={[
                styles.courseButton,
                selectedCourse?.teacher_offered_course_id === course.teacher_offered_course_id && 
                styles.selectedCourseButton
              ]}
              onPress={() => handleCourseSelect(course)}
            >
              <Text style={styles.courseButtonText}>{course.course_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedCourse && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryHeader}>
            Summary for {selectedCourse.course_name}
          </Text>
          
          {loading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <ScrollView style={styles.summaryScroll}>
              {summary?.Quiz && renderSummaryCard('Quiz', summary.Quiz)}
              {summary?.Assignment && renderSummaryCard('Assignment', summary.Assignment)}
              {summary?.LabTask && renderSummaryCard('Lab Task', summary.LabTask)}
              
              {!summary && (
                <Text style={styles.noSummaryText}>No summary data available</Text>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
   
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  coursesContainer: {
    marginVertical: 20,
    marginHorizontal:5,
    maxHeight: 50,
  },
  courseButton: {
    padding: 10,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  selectedCourseButton: {
    backgroundColor: '#4a9ff5',
  },
  courseButtonText: {
    color: '#333',
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#444',
  },
  summaryScroll: {
    flex: 1,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  noSummaryText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
});

export default ConsiderTaskJ;