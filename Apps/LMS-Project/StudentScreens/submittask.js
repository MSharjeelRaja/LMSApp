import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import colors from '../ControlsAPI/colors';
import { Picker } from "@react-native-picker/picker";
import { pick } from '@react-native-documents/picker';
import { API_URL, Navbar } from '../ControlsAPI/Comps';

const Submittask = ({navigation, route}) => {
    const [file, setFile] = useState(null);
    const [mcqAnswers, setMcqAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
   

    const userData = route.params?.userData || {}; 
    const task = route.params?.task || {};

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
            }
            } catch (err) {
            if (!err.isCancel) {
                Alert.alert("Error", "Failed to select file: " + err.message);
            }
            }
        };

    const handleMcqAnswerChange = (qNo, answer) => {
        const newAnswers = mcqAnswers.filter(item => item.QNo !== qNo);
        setMcqAnswers([...newAnswers, { QNo: qNo, StudentAnswer: answer }]);
    };

    const submitanswer = async () => {
        setLoading(true);
        let response; // Declare response at the function scope
        
        try {
            let formData = new FormData();
    
            // Common data for all task types
            formData.append('student_id', userData.id);
            formData.append('task_id', task.task_id);
            console.log('Student ID:', userData.id, 'Task ID:', task.task_id);
            
            if (task.type === 'mcq') {
                // Handle MCQ submission
                const payload = {
                    student_id: userData.id,
                    task_id: task.task_id,
                    Answer: mcqAnswers.sort((a, b) => a.QNo - b.QNo)
                };
                
                console.log('MCQ Payload:', payload);
                
                response = await fetch(`${API_URL}/api/Students/submitTask`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // Handle file-based tasks (assignment/labtask)
                if (!file) {
                    Alert.alert("Error", "Please select a file first!");
                    setLoading(false);
                    return;
                }
    
                formData.append("Answer", {
                    uri: file.uri,
                    name: file.name,
                    type: file.type || 'application/pdf',
                });
    
                console.log('File to upload:', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type
                });
    
                response = await fetch(`${API_URL}/api/Students/submitTask`, {
                    method: 'POST',
                    body: formData,
                    // Don't set Content-Type header when using FormData
                    // The browser will set it automatically with the correct boundary
                });
            }
    
            const result = await response.json();
            console.log('API Response:', result);
            
            if (response.ok) {
                Alert.alert("Success", "Task submitted successfully!");
                navigation.goBack();
            } else {
                Alert.alert("Error", result.error || result.message|| "Submission failed");
            }
        } catch (error) {
            console.error('Submission Error:', error);
            Alert.alert("Error", error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };
    return (
        <View style={styles.con}>
            <Navbar
                title={`Submit Task`}
                userName={userData.name}
                des="Student"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                onLogout={() => navigation.replace('Login')}
            />

            <View style={styles.content}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                
                {task.type === 'mcq' ? (
                    // Render MCQ inputs
                    <View style={styles.mcqContainer}>
                        {[...Array(task.total_questions).keys()].map((qNo) => (
                            <View key={qNo} style={styles.questionInput}>
                                <Text>Question {qNo + 1}:</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={`Answer for question ${qNo + 1}`}
                                    onChangeText={(text) => handleMcqAnswerChange(qNo + 1, text)}
                                />
                            </View>
                        ))}
                    </View>
                ) : (
                    // Render file upload section
                    <View style={styles.fileSection}>
                        <TouchableOpacity style={styles.uploadButton} onPress={pickFile}>
                            <Text style={styles.buttonText}>Select File</Text>
                        </TouchableOpacity>
                        {file && <Text style={styles.fileName}>{file.name}</Text>}
                    </View>
                )}

                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={submitanswer}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Submit Task</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    con: {
        backgroundColor: colors.bg,
        flex: 1
    },
    content: {
        padding: 20
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20
    },
    uploadButton: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10
    },
    submitButton: {
        backgroundColor: colors.secondary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    fileName: {
        marginTop: 10,
        color: colors.textSecondary
    },
    mcqContainer: {
        marginVertical: 10
    },
    questionInput: {
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 10,
        marginTop: 5
    }
});

export default Submittask;