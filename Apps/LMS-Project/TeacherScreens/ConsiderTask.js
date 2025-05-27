import { 
    StyleSheet, 
    Text, 
    View, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    TextInput,
    Dimensions
  } from 'react-native'
  import React, { useState, useEffect } from 'react'
  import { API_URL, Navbar } from '../ControlsAPI/Comps'
  import colors from '../ControlsAPI/colors'
  import { useAlert } from '../ControlsAPI/alert';
  
  const { width } = Dimensions.get('window')
  
  const ConsiderTask = ({navigation, route}) => {
    const alertContext = useAlert();
    const userData = route.params?.userData || {};
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [summary, setSummary] = useState(null);
    const [formData, setFormData] = useState({
      Quiz: { Teacher: '', 'Junior Lecturer': '' },
      Assignment: { Teacher: '', 'Junior Lecturer': '' },
      LabTask: { Teacher: '', 'Junior Lecturer': '' }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    useEffect(() => {
      const fetchCourses = async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/Teachers/your-courses?teacher_id=${userData.id}`
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
        
        if (data.status === 'success' && data.summary) {
          setSummary(data.summary);
          const newFormData = {
            Quiz: { 
              Teacher: data.summary.Quiz?.Teacher?.toString() || '',
              'Junior Lecturer': data.summary.Quiz?.['Junior Lecturer']?.toString() || '' 
            },
            Assignment: { 
              Teacher: data.summary.Assignment?.Teacher?.toString() || '',
              'Junior Lecturer': data.summary.Assignment?.['Junior Lecturer']?.toString() || '' 
            },
            LabTask: { 
              Teacher: data.summary.LabTask?.Teacher?.toString() || '',
              'Junior Lecturer': data.summary.LabTask?.['Junior Lecturer']?.toString() || '' 
            }
          };
          setFormData(newFormData);
        } else {
          setFormData({
            Quiz: { Teacher: '', 'Junior Lecturer': '' },
            Assignment: { Teacher: '', 'Junior Lecturer': '' },
            LabTask: { Teacher: '', 'Junior Lecturer': '' }
          });
          setSummary(null);
        }
      } catch (err) {
        alertContext.showAlert('error', 'Failed to fetch summary');
      } finally {
        setLoading(false);
      }
    };
  
    const handleInputChange = (type, field, value) => {
      setFormData(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value.replace(/[^0-9]/g, '')
        }
      }));
    };
  
    const handleSubmit = async () => {
      setIsSubmitting(true);
      try {
        const isLabCourse = selectedCourse.lab === "Yes";
        var totalq=0;
        if(formData.Quiz['Junior Lecturer']>=1){
           totalq=parseInt(formData.Quiz.Teacher)+parseInt(formData.Quiz['Junior Lecturer']);
      
        }else {
totalq=parseInt(formData.Quiz.Teacher);
        }
        var totala=0;
        if(formData.Assignment['Junior Lecturer']>=1){
           totala=parseInt(formData.Assignment.Teacher)+parseInt(formData.Assignment['Junior Lecturer']);
      
        }else {
totala=parseInt(formData.Quiz.Teacher);
        }
        if (isLabCourse) {
        var totall=0;
        if( formData.LabTask['Junior Lecturer']>=1){
           totall=parseInt( formData.LabTask.Teacher)+parseInt( formData.LabTask['Junior Lecturer']);
      
        }else {
totall=parseInt(formData.Quiz.Teacher);
        }}
        const payload = {
       
          teacher_offered_course_id: selectedCourse.teacher_offered_course_id,
          data: {
            Quiz: {
              Teacher: formData.Quiz.Teacher || "0",
              'Junior Lecturer': formData.Quiz['Junior Lecturer'] === "0" ? "" : (formData.Quiz['Junior Lecturer'] || ""),

              Total: (totalq).toString()
            },
            Assignment: {
              Teacher: formData.Assignment.Teacher || "0",
              'Junior Lecturer': formData.Assignment['Junior Lecturer'] === "0" ? "" : (formData.Assignment['Junior Lecturer'] || ""),
              Total: (totala).toString()
            }
          }
        };
        console.log('Payload:', payload);
  
        if (isLabCourse) {
          payload.data.LabTask = {
            Teacher: formData.LabTask.Teacher || "0",
            'Junior Lecturer': formData.LabTask['Junior Lecturer'] === "0" ? "" : (formData.LabTask['Junior Lecturer'] || ""),
            Total: (totall).toString()
          };
        }
  
        const response = await fetch(`${API_URL}/api/Teachers/task-consideration`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
  
        const data = await response.json();
  
        if (data.errors) {
          alertContext.showAlert('warning', data.errors.join('\n'));
        } else if (data.error) {
          alertContext.showAlert('error', data.error);
        } else {
          alertContext.showAlert('success', 'Task considerations saved successfully');
          setSummary(data.data);
        }
      } catch (err) {
        alertContext.showAlert('error', 'Failed to save considerations');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const renderCourseCard = (course) => (
      <View key={course.teacher_offered_course_id}>
        <TouchableOpacity 
          style={[
            styles.courseCard, 
            selectedCourse?.teacher_offered_course_id === course.teacher_offered_course_id && 
              styles.selectedCourseCard
          ]}
          onPress={() => handleCourseSelect(course)}
        >
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{course.course_name}</Text>
            {course.lab === "Yes" && (
              <View style={styles.labBadge}>
                <Text style={styles.labText}>LAB</Text>
              </View>
            )}
          </View>
          <Text style={styles.courseCode}>{course.course_code} - {course.section_name}</Text>
          <Text style={styles.enrollments}>{course.total_enrollments} students enrolled</Text>
        </TouchableOpacity>
  
        {selectedCourse?.teacher_offered_course_id === course.teacher_offered_course_id && (
          <View style={styles.formContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Text style={styles.sectionTitle}>Task Considerations</Text>
                
                {['Quiz', 'Assignment'].map((type) => (
                  <View key={type} style={styles.taskTypeContainer}>
                    <Text style={styles.taskTypeTitle}>{type}</Text>
                    
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Teacher:</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={formData[type].Teacher}
                        onChangeText={(text) => handleInputChange(type, 'Teacher', text)}
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                    
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Junior Lecturer:</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={formData[type]['Junior Lecturer']}
                        onChangeText={(text) => handleInputChange(type, 'Junior Lecturer', text)}
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                ))}
                
                {course.lab === "Yes" && (
                  <View style={styles.taskTypeContainer}>
                    <Text style={styles.taskTypeTitle}>LabTask</Text>
                    
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Teacher:</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={formData.LabTask.Teacher}
                        onChangeText={(text) => handleInputChange('LabTask', 'Teacher', text)}
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                    
                    <View style={styles.inputRow}>
                      <Text style={styles.inputLabel}>Junior Lecturer:</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={formData.LabTask['Junior Lecturer']}
                        onChangeText={(text) => handleInputChange('LabTask', 'Junior Lecturer', text)}
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {summary ? 'Update Considerations' : 'Submit Considerations'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  
    if (loading && courses.length === 0) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" style={styles.loader} />
        </View>
      );
    }
  
    return (
      <View style={styles.container}>
        <Navbar
          title="Consider Task"
          userName={userData.name}
          des="Teacher"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          onLogout={() => navigation.replace('Login')}
        />
  
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.header}>Select a Course to Set Task Considerations</Text>
          
          <View style={styles.coursesContainer}>
            {courses.length > 0 ? (
              courses.map(renderCourseCard)
            ) : (
              <Text style={styles.noCoursesText}>No active courses available</Text>
            )}
          </View>
        </ScrollView>
      </View>
    )
  }
  
  // Keep the styles object exactly as in your original code
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
      padding: 16,
      paddingBottom: 30,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 20,
      color: colors.primaryDark,
      textAlign: 'center',
    },
    coursesContainer: {
      marginBottom: 20,
    },
    courseCard: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    selectedCourseCard: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    courseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#212529',
      flex: 1,
    },
    labBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginLeft: 10,
    },
    labText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: 'white',
    },
    courseCode: {
      fontSize: 14,
      color: '#495057',
      marginBottom: 4,
    },
    enrollments: {
      fontSize: 12,
      color: '#6c757d',
    },
    noCoursesText: {
      textAlign: 'center',
      color: '#6c757d',
      marginTop: 20,
      fontSize: 16,
    },
    formContainer: {
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginTop: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#e9ecef',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors.primaryDark,
      textAlign: 'center',
    },
    taskTypeContainer: {
      marginBottom: 20,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      padding: 12,
    },
    taskTypeTitle: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 12,
      color: colors.primary,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    inputLabel: {
      width: 120,
      fontSize: 14,
      color: '#495057',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ced4da',
      borderRadius: 6,
      padding: 10,
      backgroundColor: 'white',
      color: '#212529',
      fontSize: 14,
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
      marginTop: 16,
    },
    submitButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
  });
  
  export default ConsiderTask;