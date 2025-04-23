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
    const alertContext = useAlert() // Get alert context for notifications

    // Fetch transcript data from API
    const fetchTranscriptData = async () => {
        try {
            const response = await fetch(`${API_URL}/api/Students/Transcript?student_id=${userData.id}`)
            const data = await response.json()
            
            if (response.ok) {
                setTranscriptData(data)
                // Calculate failed courses
                const failed = data.reduce((count, session) => {
                    return count + session.subjects.filter(subject => subject.grade === 'F').length
                }, 0)
                setFailedCoursesCount(failed)
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

    const handleDownloadTranscript = async () => {
        try {
            // 1. Prepare download path
            const downloadsPath = RNFetchBlob.fs.dirs.DownloadDir;
            const fileName = `Transcript_${userData.id}_${Date.now()}.pdf`;
            const filePath = `${downloadsPath}/${fileName}`;
        
            console.log('Preparing download to:', filePath);
        
            // 2. Show confirmation dialog
            alertContext.showAlert('info', 'Starting download...', 'Transcript', 3000);
        
            // 3. Start download with progress tracking
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
        
            // 4. Set timeout for download
            const timeout = setTimeout(() => {
                if (!downloadStarted) {
                    downloadTask.cancel();
                    throw new Error('Download timed out - server not responding');
                }
            }, 15000); // 15 seconds timeout
        
            // 5. Track download progress
            downloadTask.progress((received, total) => {
                downloadStarted = true;
                console.log(`Progress: ${received}/${total}`);
            });
        
            // 6. Handle download completion
            const res = await downloadTask;
            clearTimeout(timeout);
        
            console.log('Download completed with status:', res.info().status);
            console.log('File saved to:', res.path());
        
            // 7. Verify the downloaded file
            const fileExists = await RNFetchBlob.fs.exists(res.path());
            if (!fileExists) {
                throw new Error('File not found after download');
            }
        
            const stats = await RNFetchBlob.fs.stat(res.path());
            if (stats.size < 100) { // Check if file is too small (likely invalid)
                await RNFetchBlob.fs.unlink(res.path());
                throw new Error('Downloaded file is too small (possibly invalid)');
            }
        
            alertContext.showAlert('success', 'Transcript downloaded successfully', 'Download Complete', 3000);
        
        } catch (error) {
            console.error('Download failed:', {
                error: error.message,
                stack: error.stack,
                code: error.code
            });
        
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
                    title="Transcript"
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
                title="Transcript"
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
            
            {/* Session-wise Results with improved table layout */}
            {transcriptData.map((session, index) => (
                <View key={index} style={styles.sessionContainer}>
                    <Text style={styles.sessionHeader}>{session.session_name}</Text>
                    
                    <View style={styles.tableContainer}>
                        {/* Custom Table Header */}
                        <View style={styles.tableHeader}>
                            <View style={styles.codeColumn}><Text style={styles.headerText}>Code</Text></View>
                            <View style={styles.courseColumn}><Text style={styles.headerText}>Course</Text></View>
                            <View style={styles.creditColumn}><Text style={styles.headerText}>Credits</Text></View>
                            <View style={styles.gradeColumn}><Text style={styles.headerText}>Grade</Text></View>
                        </View>
                        
                        {/* Table Rows */}
                        {session.subjects.map((subject, subIndex) => (
                            <View 
                                key={subIndex} 
                                style={[
                                    styles.tableRow,
                                    subject.grade === 'F' && styles.failedRow
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
                                        subject.grade === 'A' ? styles.excellentGrade :
                                        styles.normalGrade
                                    ]}>
                                        {subject.grade}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        
                        {/* Session Summary Row */}
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
        backgroundColor: colors.bg,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: colors.dark,
    },
    summaryCard: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 11,
        margin: 10,
        elevation: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    summaryValue: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    gpaText: {
        color: '#4CAF50',
    },
    failedText: {
        color: '#F44336',
    },
    passedText: {
        color: '#4CAF50',
    },
    downloadButton: {
        flexDirection: 'row',
        backgroundColor: colors.secondary,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
       
    },
    downloadButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    sessionContainer: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    sessionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 12,
        paddingLeft: 8,
    },
    // New custom table styles for better alignment
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.primaryLight,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerText: {
        fontWeight: 'bold',
        color: colors.primaryDark,
        fontSize: 13,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minHeight: 50, // Minimum height for rows with long course names
    },
    // Column sizing - adjusted for proper spacing
    codeColumn: {
        width: '19%',
        paddingHorizontal: 6,
        justifyContent: 'center',
    },
    courseColumn: {
        width: '46%', // Increased for long course names
        paddingHorizontal: 10,
        
        justifyContent: 'center',
    },
    creditColumn: {
        width: '15%',
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradeColumn: {
        width: '19%',
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Text styles for each column
    codeText: {
        fontSize: 13,
        color: colors.dark,
    },
    courseText: {
        fontSize: 13,
        color: colors.dark,
        flexWrap: 'wrap', // Allow wrapping for long course names
    },
    creditText: {
        fontSize: 13,
        textAlign: 'center',
        color: colors.dark,
    },
    gradeText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    failedRow: {
        backgroundColor: '#FFEBEE',
    },
    failedGrade: {
        color: '#F44336',
        fontWeight: 'bold',
    },
    excellentGrade: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    normalGrade: {
        color: colors.dark,
    },
    sessionSummaryRow: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        paddingVertical: 5,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    summaryRowText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.dark,
    },
})

export default Exam