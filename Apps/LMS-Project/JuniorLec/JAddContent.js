import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { pick } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, Navbar } from "../ControlsAPI/Comps";
import colors from "../ControlsAPI/colors";

const AddContent = ({ navigation, route }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [week, setWeek] = useState("");
  const [file, setFile] = useState(null);
  const [mcqs, setMcqs] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [points, setPoints] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const userData = route.params?.userData || {};
  console.log('User Data:', userData.id);
  const MCQ_STORAGE_KEY = `mcqs_${selectedCourse}_${week}`;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/JuniorLec/your-courses?teacher_id=${userData.id}`
        );
        const data = await response.json();
console.log('Fetched courses:', data);
        if (data.status === "success") {
          setCourses(data.data.active_courses);
        } else {
          Alert.alert("Error", "Failed to fetch courses");
        }
      } catch (err) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Load saved MCQs when course or week changes
  useEffect(() => {
    if (selectedCourse && week) {
      loadSavedMcqs();
    }
  }, [selectedCourse, week]);

  const loadSavedMcqs = async () => {
    try {
      const savedMcqs = await AsyncStorage.getItem(MCQ_STORAGE_KEY);
      if (savedMcqs) {
        setMcqs(JSON.parse(savedMcqs));
      } else {
        setMcqs([]);
      }
    } catch (error) {
      console.error("Error loading MCQs:", error);
    }
  };

  const saveMcqsLocally = async (mcqsToSave) => {
    try {
      await AsyncStorage.setItem(MCQ_STORAGE_KEY, JSON.stringify(mcqsToSave));
    } catch (error) {
      console.error("Error saving MCQs:", error);
    }
  };

  const pickFile = async () => {
    try {
      const [res] = await pick({ allowMultiSelection: false });
  
      if (res) {
        const allowedTypes = ['application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const fileType = res.type || res.name.split('.').pop();

        if (!allowedTypes.includes(fileType)) {
          Alert.alert("Error", "Please pick a PDF or Word file.");
          return;
        }

        setFile({ uri: res.uri, name: res.name, type: res.type });
      } else {
        setFile(null);
      }
    } catch (err) {
      if (!err.isCancel) {
        Alert.alert("Error", "Failed to select file: " + err.message);
      }
    }
  };

  const addMcq = () => {
    if (!questionText || !points || options.includes("") || correctAnswerIndex === null) {
      Alert.alert("Error", "Please fill all fields and select correct answer");
      return;
    }
    
    const newMcq = {
      qNO: mcqs.length + 1,
      question_text: questionText,
      points:points,
      option1: options[0],
      option2: options[1],
      option3: options[2],
      option4: options[3],
      Answer: options[correctAnswerIndex], // Store the actual option value
    };
    
    const updatedMcqs = [...mcqs, newMcq];
    setMcqs(updatedMcqs);
    saveMcqsLocally(updatedMcqs);
    
    
    setQuestionText("");
    setPoints("");
    setOptions(["", "", "", ""]);
    setCorrectAnswerIndex(null);
  };

  const removeMcq = (index) => {
    const updatedMcqs = mcqs.filter((_, i) => i !== index);
    // Reassign question numbers
    const renumberedMcqs = updatedMcqs.map((mcq, i) => ({
      ...mcq,
      qNO: i + 1
    }));
    
    setMcqs(renumberedMcqs);
    saveMcqsLocally(renumberedMcqs);
  };

  const handleApiError = (error, result) => {
    if (result?.error?.includes("The Week Notes Are Already Uploaded")) {
      Alert.alert(
        "Content Exists",
        "This week's content already exists and cannot be overwritten",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert("Error", result?.message || "Upload failed. Please try again.");
    }
  };

  const uploadData = async () => {
    if (!selectedCourse || !selectedType || !week) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    if (selectedType === "MCQS" && mcqs.length === 0) {
      Alert.alert("Error", "Please add at least one MCQ");
      return;
    }

    const formData = new FormData();
    formData.append("offered_course_id", selectedCourse);
    formData.append("type", selectedType);
    formData.append("week", week);

    if (selectedType === "MCQS") {
      mcqs.forEach((mcq, index) => {
        formData.append(`MCQS[${index}][qNO]`, mcq.qNO);
        formData.append(`MCQS[${index}][question_text]`, mcq.question_text);
        formData.append(`MCQS[${index}][points]`, mcq.points);
        formData.append(`MCQS[${index}][option1]`, mcq.option1);
        formData.append(`MCQS[${index}][option2]`, mcq.option2);
        formData.append(`MCQS[${index}][option3]`, mcq.option3);
        formData.append(`MCQS[${index}][option4]`, mcq.option4);
        formData.append(`MCQS[${index}][Answer]`, mcq.Answer); // Actual option value
      });
    }
   // Helpful debug code - keep this temporarily

    if (file) {
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/pdf',
      });
    }
    console.log("FormData being sent:", formData);
    console.log("Selected Course:", file);


    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/Teachers/create/course_content`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const result = await response.json();
      if (result.status === "success") {
        // Clear local storage after successful upload
        await AsyncStorage.removeItem(MCQ_STORAGE_KEY);
        Alert.alert(
          "Success",
          "Content uploaded successfully!",
         
        );
      } else {
        handleApiError(null, result);
      }
    } catch (error) {
      handleApiError(error, error.result);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
   <View style={styles.mcontainer}>
      <Navbar
        title="LMS"
        userName={userData.name}
        des={'Junior Lecturer'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />
      <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.sectionTitle}>Course Details</Text>
          <Text style={styles.label}>Select Course</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCourse}
              onValueChange={setSelectedCourse}
              style={styles.picker}
              dropdownIconColor={colors.primaryDark}
            >
              <Picker.Item label="Select Course" value={null} />
              {courses.map((course) => (
                <Picker.Item 
                  key={course.offered_course_id}
                  label={course.course_name}
                  value={course.offered_course_id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Content Type</Text>
          <View style={styles.typeContainer}>
            {["Notes", "Assignment", "Quiz","LabTask", "MCQS"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.selectedTypeButton
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === type && styles.selectedTypeText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Week Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Week Number"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={week}
            onChangeText={setWeek}
          />
        </View>

        {selectedType !== "MCQS" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload File (PDF/DOC/DOCX)</Text>
            <TouchableOpacity
              style={styles.fileButton}
              onPress={pickFile}
            >
              <Icon name="cloud-upload" size={24} color={colors.primaryDark} />
              <Text style={styles.fileButtonText}>
                {file ? file.name : 'Choose File'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedType === "MCQS" && (
          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Add MCQs</Text>

            <TextInput
              style={styles.input}
              placeholder="Question Text"
              placeholderTextColor={colors.placeholder}
              value={questionText}
              onChangeText={setQuestionText}
            />

            <TextInput
              style={styles.input}
              placeholder="Points"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              value={points}
              onChangeText={setPoints}
            />

            <Text style={styles.label}>Options (Select correct answer)</Text>
            {options.map((opt, index) => (
              <View key={index} style={styles.optionContainer}>
                <TextInput
                  style={[
                    styles.optionInput,
                    correctAnswerIndex === index && styles.correctOption
                  ]}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={colors.placeholder}
                  value={opt}
                  onChangeText={(text) => {
                    const newOptions = [...options];
                    newOptions[index] = text;
                    setOptions(newOptions);
                  }}
                />
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => {
                    setCorrectAnswerIndex(prev => 
                      prev === index ? null : index
                    );
                  }}
                >
                  <Icon
                    name={correctAnswerIndex === index ? "check-circle" : "radio-button-unchecked"}
                    size={24}
                    color={correctAnswerIndex === index ? colors.success : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={addMcq}
            >
              <Icon name="add" size={24} color={colors.white} />
              <Text style={styles.addButtonText}>Add MCQ</Text>
            </TouchableOpacity>

            {/* Display added MCQs */}
            {mcqs.length > 0 && (
              <View style={styles.mcqListContainer}>
                <Text style={styles.mcqListTitle}>Added Questions ({mcqs.length})</Text>
                {mcqs.map((mcq, index) => (
                  <View key={index} style={styles.mcqItem}>
                    <View style={styles.mcqTextContainer}>
                      <Text style={styles.mcqQuestion}>
                        Q{mcq.qNO}: {mcq.question_text}
                      </Text>
                      <Text style={styles.mcqAnswer}>
                        Correct Answer: {mcq.Answer}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeMcq(index)}
                    >
                      <Icon name="delete" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={uploadData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Upload Content</Text>
              <Icon name="send" size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 9,
  },mcontainer: {
    flex: 1,
    backgroundColor: colors.white,
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  formContainer: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.primaryDark,
    marginBottom: 16,
    paddingLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  label: {
    fontSize: 14,
    color: colors.blueNavy,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderColor: colors.primaryLight,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: colors.primaryFaint,
    color: colors.black,
    fontWeight: '500',
  },
  pickerContainer: {
    borderColor: colors.primaryLight,
    borderWidth: 1.5,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.primaryFaint,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    color: colors.primaryDark,
    backgroundColor: colors.primaryFaint,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  selectedTypeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  typeButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTypeText: {
    color: colors.white,
    fontWeight: '600',
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryFaint,
    borderRadius: 8,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  fileButtonText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green2,
    borderRadius: 8,
    padding: 14,
    gap: 8,
    marginTop: 16,
    elevation: 2,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    marginTop: 24,
    elevation: 3,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optionContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 8,
  },
  optionInput: {
    backgroundColor: colors.primaryFaint,
    color: colors.black,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    paddingRight: 40,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
  },
  correctOption: {
    borderColor: colors.green2,
    backgroundColor: colors.Greenborder3,
  },
  radioButton: {
    position: 'absolute',
    right: 10,
    top: 12,
    padding: 4,
  },
  mcqListContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    paddingTop: 16,
  },
  mcqListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 12,
  },
  mcqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryFaint,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  mcqTextContainer: {
    flex: 1,
  },
  mcqQuestion: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mcqAnswer: {
    color: colors.green2,
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
});

export default AddContent;