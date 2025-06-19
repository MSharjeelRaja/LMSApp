import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { API_URL, Navbar } from '../ControlsAPI/Comps'
import colors from '../ControlsAPI/colors'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { DataTable } from 'react-native-paper'
import RNFetchBlob from 'react-native-blob-util'
import { useAlert } from '../ControlsAPI/alert'

const Exam = ({route, navigation}) => {
    const userData = route.params.userData
    const [transcriptData, setTranscriptData] = useState([])
    const [loading, setLoading] = useState(true)
    const [failedCoursesCount, setFailedCoursesCount] = useState(0)
    const [failedCourses, setFailedCourses] = useState([]) // Track failed courses for re-enrollment
    const alertContext = useAlert()

    const fetchTranscriptData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/Students/Transcript?student_id=${userData.id}`)
            const data = await response.json()
            
            if (response.ok) {
                setTranscriptData(data)
                // Calculate failed courses and collect them
                const failed = [];
                const failedCount = data.reduce((count, session) => {
                    const sessionFailed = session.subjects.filter(subject => 
                        subject.grade === 'F' || subject.grade === 'D'
                    );
                    failed.push(...sessionFailed.map(course => ({
                        ...course,
                        session_name: session.session_name,
                        student_offered_course_id: course.overall?.student_offered_course_id
                    })));
                    return count + sessionFailed.length;
                }, 0);
                
                setFailedCoursesCount(failedCount);
                setFailedCourses(failed);
            } else {
                throw new Error(data.message || 'Failed to fetch transcript')
            }
        } catch (error) {
            console.error('Fetch transcript error:', error)
            Alert.alert('Error', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleReEnroll = (course) => {
        Alert.alert(
            'Re-enroll Confirmation',
            `Are you sure you want to re-enroll in ${course.course_name} (${course.course_code})?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Yes',
                    onPress: () => confirmReEnroll(course)
                }
            ]
        );
    };

    const confirmReEnroll = async (course) => {
        if (!course.student_offered_course_id) {
            alertContext.showAlert('error', 'Invalid course ID for re-enrollment', 'Error', 3000);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/Insertion/re_enroll/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_offered_course_id: course.student_offered_course_id.toString()
                })
            });

            const result = await response.json();

            if (response.ok) {
                alertContext.showAlert('success', 'Successfully re-enrolled in the course', 'Success', 3000);
                // Refresh the transcript data
                fetchTranscriptData();
            } else {
                throw new Error(result.message || 'Failed to re-enroll');
            }
        } catch (error) {
            console.error('Re-enroll error:', error);
            alertContext.showAlert('error', error.message, 'Re-enroll Failed', 3000);
        }
    };

    const handleDownloadTranscript = async () => {
        try {
            const downloadsPath = RNFetchBlob.fs.dirs.DownloadDir;
            const fileName = `Transcript_${userData.id}_${Date.now()}.pdf`;
            const filePath = `${downloadsPath}/${fileName}`;
        
            alertContext.showAlert('info', 'Starting download...', 'Transcript', 3000);
        
            let downloadStarted = false;
            const downloadTask = RNFetchBlob.config({
                fileCache: false,
                path: filePath,
                addAndroidDownloads: {
                    useDownloadManager: true,
                    notification: true,
                    title: `Transcript ${userData.id}`,
                    description: 'Downloading transcript...',
                    path: filePath,
                    mime: 'application/pdf',
                    mediaScannable: true,
                    visible: true,
                }
            }).fetch(
                'GET',
                `${API_URL}/api/Students/TranscriptPDF?student_id=${userData.id}`,
                { 'Content-Type': 'application/pdf' }
            );
        
            const timeout = setTimeout(() => {
                if (!downloadStarted) {
                    downloadTask.cancel();
                    throw new Error('Download timed out - server not responding');
                }
            }, 15000);
        
            downloadTask.progress((received, total) => {
                downloadStarted = true;
                console.log(`Progress: ${received}/${total}`);
            });
        
            const res = await downloadTask;
            clearTimeout(timeout);
        
            const fileExists = await RNFetchBlob.fs.exists(res.path());
            if (!fileExists) {
                throw new Error('File not found after download');
            }
        
            const stats = await RNFetchBlob.fs.stat(res.path());
            if (stats.size < 100) {
                await RNFetchBlob.fs.unlink(res.path());
                throw new Error('Downloaded file is too small (possibly invalid)');
            }
        
            alertContext.showAlert('success', 'Transcript downloaded successfully', 'Download Complete', 3000);
        
        } catch (error) {
            console.error('Download failed:', error);
            let errorMessage = 'Download failed';
            if (error.message.includes('timed out')) {
                errorMessage = 'Server took too long to respond';
            } else if (error.message.includes('ENOENT')) {
                errorMessage = 'Could not access storage';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Network error - check your connection';
            }
        
            alertContext.showAlert('error', errorMessage, 'Download Error', 3000);
        }
    };

    useEffect(() => {
        fetchTranscriptData()
    }, [])

    if (loading) {
        return (
            <View style={styles.container}>
               <Navbar
                title="Exam Result"
                userName={userData.name}
                des={'Student'}
                onLogout={() => navigation.replace('Login')}
                showBackButton={true}
                onBack={() => navigation.goBack()}
            />
                <Text style={styles.loadingText}>Loading transcript...</Text>
            </View>
        )
    }

    return (
        <ScrollView style={styles.container}>
            <Navbar
                title="Exam Result"
                userName={userData.name}
                des={'Student'}
                onLogout={() => navigation.replace('Login')}
                showBackButton={true}
                onBack={() => navigation.goBack()}
            />
            
            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Current Session</Text>
                        <Text style={styles.summaryValue}>
                            {transcriptData[0]?.session_name || 'N/A'}
                        </Text>
                    </View>
                    
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Credit Points</Text>
                        <Text style={styles.summaryValue}>
                            {transcriptData[0]?.total_credit_points || '0'}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Current GPA</Text>
                        <Text style={[styles.summaryValue, styles.gpaText]}>
                            {transcriptData[0]?.GPA || '0.00'}
                        </Text>
                    </View>
                    
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Failed Courses</Text>
                        <Text style={[styles.summaryValue, failedCoursesCount > 0 ? styles.failedText : styles.passedText]}>
                            {failedCoursesCount}
                        </Text>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={handleDownloadTranscript}
                >
                    <Icon name="file-download" size={20} color="white" />
                    <Text style={styles.downloadButtonText}>Download Transcript</Text>
                </TouchableOpacity>
            </View>
            
            {/* Failed Courses Section (if any) */}
            {failedCoursesCount > 0 && (
                <View style={styles.failedCoursesContainer}>
                    <Text style={styles.sectionHeader}>Courses Eligible for Re-enrollment</Text>
                    {failedCourses.map((course, index) => (
                        <View key={index} style={styles.failedCourseItem}>
                            <View style={styles.courseInfo}>
                                <Text style={styles.courseCode}>{course.course_code}</Text>
                                <Text style={styles.courseName}>{course.course_name}</Text>
                                <Text style={styles.courseSession}>{course.session_name}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.reEnrollButton}
                                onPress={() => handleReEnroll(course)}
                            >
                                <Text style={styles.reEnrollButtonText}>Re-enroll</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
            
            {/* Session-wise Results */}
            {transcriptData.map((session, index) => (
                <View key={index} style={styles.sessionContainer}>
                    <Text style={styles.sessionHeader}>{session.session_name}</Text>
                    
                    <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <View style={styles.codeColumn}><Text style={styles.headerText}>Code</Text></View>
                            <View style={styles.courseColumn}><Text style={styles.headerText}>Course</Text></View>
                            <View style={styles.creditColumn}><Text style={styles.headerText}>Credits</Text></View>
                            <View style={styles.gradeColumn}><Text style={styles.headerText}>Grade</Text></View>
                        </View>
                        
                        {session.subjects.map((subject, subIndex) => (
                            <View 
                                key={subIndex} 
                                style={[
                                    styles.tableRow,
                                    (subject.grade === 'F' || subject.grade === 'D') && styles.failedRow
                                ]}
                            >
                                <View style={styles.codeColumn}>
                                    <Text style={styles.codeText}>{subject.course_code}</Text>
                                </View>
                                <View style={styles.courseColumn}>
                                    <Text style={styles.courseText} numberOfLines={2} ellipsizeMode="tail">
                                        {subject.course_name}
                                    </Text>
                                </View>
                                <View style={styles.creditColumn}>
                                    <Text style={styles.creditText}>{subject.credit_hours}</Text>
                                </View>
                                <View style={styles.gradeColumn}>
                                    <Text style={[
                                        styles.gradeText,
                                        subject.grade === 'F' ? styles.failedGrade : 
                                        subject.grade === 'D' ? styles.warningGrade :
                                        subject.grade === 'A' ? styles.excellentGrade :
                                        styles.normalGrade
                                    ]}>
                                        {subject.grade}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        
                        <View style={styles.sessionSummaryRow}>
                            <View style={styles.codeColumn}>
                                <Text style={styles.summaryRowText}>Session GPA:</Text>
                            </View>
                            <View style={styles.courseColumn}></View>
                            <View style={styles.creditColumn}>
                                <Text style={styles.summaryRowText}>{session.total_credit_points} pts</Text>
                            </View>
                            <View style={styles.gradeColumn}>
                                <Text style={[styles.summaryRowText, styles.gpaText]}>{session.GPA}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        margin: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryItem: {
        flex: 1,
        padding: 5,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    gpaText: {
        color: '#2e7d32', // Dark green for GPA
    },
    failedText: {
        color: '#c62828', // Red for failed courses
    },
    passedText: {
        color: '#2e7d32', // Green for passed
    },
    downloadButton: {
        flexDirection: 'row',
        backgroundColor: '#1565c0',
        padding: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    downloadButtonText: {
        color: 'white',
        marginLeft: 10,
        fontWeight: 'bold',
    },
    sessionContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        margin: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sessionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    tableContainer: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 8,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    failedRow: {
        backgroundColor: '#ffebee', // Light red background for failed courses
    },
    codeColumn: {
        width: '20%',
        justifyContent: 'center',
    },
    courseColumn: {
        width: '45%',
        justifyContent: 'center',
    },
    creditColumn: {
        width: '15%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradeColumn: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontWeight: 'bold',
        color: '#333',
    },
    codeText: {
        fontSize: 14,
        color: '#333',
    },
    courseText: {
        fontSize: 14,
        color: '#333',
    },
    creditText: {
        fontSize: 14,
        color: '#333',
    },
    gradeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    failedGrade: {
        color: '#c62828', // Red for F
    },
    warningGrade: {
        color: '#ff8f00', // Orange for D
    },
    excellentGrade: {
        color: '#2e7d32', // Green for A
    },
    normalGrade: {
        color: '#333', // Default for other grades
    },
    sessionSummaryRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    summaryRowText: {
        fontWeight: 'bold',
        color: '#333',
    },
    failedCoursesContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        margin: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    failedCourseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    courseInfo: {
        flex: 1,
    },
    courseCode: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    courseName: {
        fontSize: 14,
        color: '#666',
    },
    courseSession: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    reEnrollButton: {
        backgroundColor: '#1565c0',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    reEnrollButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default Exam