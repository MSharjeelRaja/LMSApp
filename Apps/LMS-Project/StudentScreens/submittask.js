import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import colors from '../ControlsAPI/colors';
import { Picker } from "@react-native-picker/picker";
import { pick } from '@react-native-documents/picker';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Submittask = ({navigation, route}) => {
    const [file, setFile] = useState(null);
    const [mcqAnswers, setMcqAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
   
    const userData = route.params?.userData || {}; 
    const task = route.params?.task || {};

    // Debugging useEffect to verify props
    useEffect(() => {
        console.log('[Submittask] Component mounted with props:', {
            userData: userData.id ? '...' : 'MISSING',
            task: task.task_id ? '...' : 'MISSING'
        });
    }, []);

    const pickFile = async () => {
        console.log('[Submittask] pickFile triggered');
        try {
            const [res] = await pick({ allowMultiSelection: false });
        
            if (res) {
                console.log('[Submittask] File selected:', {
                    name: res.name,
                    type: res.type,
                    size: res.size
                });
                
                const allowedTypes = ['application/pdf', 'application/msword', 
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                const fileType = res.type || res.name.split('.').pop();

                if (!allowedTypes.includes(fileType)) {
                    console.warn('[Submittask] Invalid file type selected:', fileType);
                    Alert.alert("Error", "Please pick a PDF or Word file.");
                    return;
                }

                setFile({ uri: res.uri, name: res.name, type: res.type });
            }
        } catch (err) {
            if (!err.isCancel) {
                console.error('[Submittask] File picker error:', err);
                Alert.alert("Error", "Failed to select file: " + err.message);
            }
        }
    };

    const handleMcqAnswerChange = (qNo, answer) => {
        console.log('[Submittask] MCQ answer changed for Q:', qNo, 'Answer:', answer);
        const newAnswers = mcqAnswers.filter(item => item.QNo !== qNo);
        setMcqAnswers([...newAnswers, { QNo: qNo, StudentAnswer: answer }]);
    };

    const submitanswer = async () => {
        console.groupCollapsed('[Submittask] submitanswer execution');
        console.log('[Submittask] Current state:', {
            file: file ? { name: file.name, type: file.type } : null,
            mcqAnswers,
            loading,
            userDataId: userData.id,
            taskId: task.task_id
        });
        
        setLoading(true);
        
        try {
            // Common validation
            if (!userData?.id) {
                console.error('[Submittask] Validation failed - Missing student ID');
                throw new Error('Student ID not found');
            }
            if (!task?.task_id) {
                console.error('[Submittask] Validation failed - Missing task ID');
                throw new Error('Task ID not found');
            }

            if (task.type === 'mcq') {
                console.log('[Submittask] Processing MCQ submission');
                const payload = {
                    student_id: userData.id,
                    task_id: task.task_id,
                    Answer: mcqAnswers.sort((a, b) => a.QNo - b.QNo).map(answer => ({
                        QNo: answer.QNo,
                        StudentAnswer: answer.StudentAnswer || ''
                    }))
                };
                
                console.log('[Submittask] MCQ Payload:', JSON.stringify(payload, null, 2));
                
                console.log('[Submittask] Sending to:', `${API_URL}/api/Students/submit-quiz`);
                const response = await fetch(`${API_URL}/api/Students/submit-quiz`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                console.log('[Submittask] Response status:', response.status);
                const responseText = await response.text();
                console.log('[Submittask] Raw response:', responseText);
                
                try {
                    const result = JSON.parse(responseText);
                    if (!response.ok) {
                        console.error('[Submittask] Submission failed:', result);
                        throw new Error(result.error || result.message || "Quiz submission failed");
                    }
                    console.log('[Submittask] Submission successful:', result);
                    Alert.alert("Success", "Quiz submitted successfully!");
                    navigation.goBack();
                } catch (e) {
                    console.error('[Submittask] Failed to parse response:', e);
                    console.error('[Submittask] Response text:', responseText);
                    throw new Error("Server returned invalid response");
                }
            } else {
                console.log('[Submittask] Processing file submission');
                if (!file) {
                    console.error('[Submittask] No file selected for submission');
                    throw new Error("Please select a file first!");
                }

                const formData = new FormData();
                formData.append('student_id', userData.id.toString());
                formData.append('task_id', task.task_id.toString());
                formData.append('Answer', {
                    uri: file.uri,
                    name: file.name || `submission_${Date.now()}.pdf`,
                    type: file.type || 'application/pdf',
                });

                console.log('[Submittask] FormData prepared:', {
                    student_id: userData.id,
                    task_id: task.task_id,
                    file: { 
                        name: file.name, 
                        type: file.type,
                        uri: file.uri.substring(0, 20) + '...' // Partial URI for security
                    }
                });

                console.log('[Submittask] Sending to:', `${API_URL}/api/Students/submit-task-file`);
                const response = await fetch(`${API_URL}/api/Students/submit-task-file`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                console.log('[Submittask] Response status:', response.status);
                const responseText = await response.text();
                console.log('[Submittask] Raw response (first 200 chars):', responseText.substring(0, 200));
                
                try {
                    const result = JSON.parse(responseText);
                    if (!response.ok) {
                        console.error('[Submittask] Submission failed:', result);
                        throw new Error(result.error || result.message || "File submission failed");
                    }
                    console.log('[Submittask] Submission successful:', result);
                    Alert.alert("Success", "File submitted successfully!");
                    navigation.goBack();
                } catch (e) {
                    console.error('[Submittask] Failed to parse response:', e);
                    if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
                        console.error('[Submittask] Server returned HTML content');
                        throw new Error("Server returned HTML instead of JSON. Check API endpoint.");
                    }
                    throw new Error("Invalid server response format");
                }
            }
        } catch (error) {
            console.error('[Submittask] Error during submission:', error);
            Alert.alert(
                "Error", 
                error.message || "An unexpected error occurred",
                [{ text: 'OK', onPress: () => console.log('Error acknowledged') }]
            );
        } finally {
            console.log('[Submittask] Submission process completed');
            setLoading(false);
            console.groupEnd();
        }
    };

    return (
        <View style={styles.container}>
            <Navbar
                title={`Submit Task`}
                userName={userData.name}
                des="Student"
                showBackButton={true}
                onBackPress={() => navigation.goBack()}
                onLogout={() => navigation.replace('Login')}
            />

            <ScrollView style={styles.scrollView}>
                <View style={styles.contentCard}>
                    <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={styles.taskTypeBadge}>
                            <Text style={styles.taskTypeText}>{task.type?.toUpperCase()}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.separator} />
                    
                    {task.type === 'mcq' ? (
                        <View style={styles.mcqContainer}>
                            {[...Array(task.total_questions || 5).keys()].map((qNo) => (
                                <View key={qNo} style={styles.questionCard}>
                                    <Text style={styles.questionNumber}>Question {qNo + 1}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your answer here..."
                                        onChangeText={(text) => handleMcqAnswerChange(qNo + 1, text)}
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.fileSection}>
                            <View style={styles.fileInstructions}>
                                <MaterialIcons name="upload-file" size={36} color={colors.primary} />
                                <Text style={styles.instructionText}>Upload your {task.type} document</Text>
                                <Text style={styles.fileSubtext}>Accepted formats: PDF, DOC, DOCX</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.uploadButton} 
                                onPress={pickFile}
                                testID="filePickerButton"
                            >
                                <MaterialIcons name="file-upload" size={22} color="white" />
                                <Text style={styles.buttonText}>Select File</Text>
                            </TouchableOpacity>
                            
                            {file && (
                                <View style={styles.fileInfoCard}>
                                    <MaterialIcons name="insert-drive-file" size={24} color={colors.primary} />
                                    <Text style={styles.fileName}>{file.name}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.submitButton, loading && styles.submittingButton]} 
                        onPress={submitanswer}
                        disabled={loading}
                        testID="submitButton"
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" />
                                <Text style={styles.buttonText}>Submitting...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonInner}>
                                <MaterialIcons name="send" size={22} color="white" />
                                <Text style={styles.buttonText}>Submit Task</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f5f7fa',
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentCard: {
        margin: 16,
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 3,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    taskTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000000',
        flex: 1,
    },
    taskTypeBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    taskTypeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E9F0',
        marginVertical: 15,
    },
    mcqContainer: {
        marginVertical: 10,
    },
    questionCard: {
        backgroundColor: '#F8F9FC',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#000000',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E9F0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontSize: 16,
    },
    fileSection: {
        alignItems: 'center',
        padding: 20,
    },
    fileInstructions: {
        alignItems: 'center',
        marginVertical: 20,
    },
    instructionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginTop: 10,
    },
    fileSubtext: {
        color: '#666',
        marginTop: 5,
    },
    uploadButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        elevation: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    fileInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        padding: 16,
        borderRadius: 10,
        marginTop: 20,
        width: '100%',
    },
    fileName: {
        marginLeft: 10,
        fontSize: 16,
        color: '#000000',
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 25,
        elevation: 2,
    },
    submittingButton: {
        backgroundColor: '#666',
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default Submittask;