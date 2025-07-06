import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';

const Degree_Courses = ({ navigation, route }) => {
   
    const userData = route.params?.userData || []

    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSemesters, setExpandedSemesters] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                setError(null);
              
                const response = await fetch(
                    `${API_URL}/api/Insertion/getYourDegreeCourses/${userData.Program}/${userData.InTake}`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log("API Response:", data);
                
                setCourses(data.courses_by_semester || []);
                setFilteredCourses(data.courses_by_semester || []);
            } catch (err) {
                console.error("Error fetching degree courses:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [userData.program, userData.InTake]);

    const toggleSemester = (semester) => {
        setExpandedSemesters(prev => ({
            ...prev,
            [semester]: !prev[semester]
        }));
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query === '') {
            setFilteredCourses(courses);
        } else {
            const filtered = courses.map(semesterCourses => 
                semesterCourses.filter(course => 
                    course.course_name.toLowerCase().includes(query.toLowerCase()) || 
                    course.course_code.toLowerCase().includes(query.toLowerCase())
                )
            ).filter(semesterCourses => semesterCourses.length > 0);
            setFilteredCourses(filtered);
        }
    };

    const renderCourseItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.courseItem}
            onPress={() => navigation.navigate('CourseDetail', { course: item })}
            activeOpacity={0.7}
        >
            <View style={styles.courseCodeContainer}>
                <Text style={styles.courseCode}>{item.course_code}</Text>
            </View>
            <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{item.course_name}</Text>
                {item.credit_hours && (
                    <Text style={styles.creditHours}>{item.credit_hours} Credit Hours</Text>
                )}
            </View>
            <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>›</Text>
            </View>
        </TouchableOpacity>
    );

    const renderSemester = (semesterCourses, index) => {
        if (semesterCourses.length === 0) return null;
        
        const semesterNumber = semesterCourses[0].semester;
        const isExpanded = expandedSemesters[semesterNumber] !== false;

        return (
            <View key={`semester-${index}`} style={styles.semesterContainer}>
                <TouchableOpacity 
                    style={styles.semesterHeader}
                    onPress={() => toggleSemester(semesterNumber)}
                    activeOpacity={0.8}
                >
                    <View style={styles.semesterHeaderContent}>
                        <Text style={styles.semesterTitle}>Semester {semesterNumber}</Text>
                        <Text style={styles.courseCount}>{semesterCourses.length} courses</Text>
                    </View>
                    <View style={[styles.expandIconContainer, isExpanded && styles.expandIconContainerExpanded]}>
                        <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
                    </View>
                </TouchableOpacity>
                
                {isExpanded && (
                    <View style={styles.coursesListContainer}>
                        <FlatList
                            data={semesterCourses}
                            renderItem={renderCourseItem}
                            keyExtractor={(item) => `course-${item.course_no}`}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Navbar
                    title="Degree Courses"
                    userName={userData.name}
                    des={'Student'}
                    onLogout={() => navigation.replace('Login')}
                    showBackButton={true}
                    onBack={() => navigation.goBack()}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Loading your courses...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Navbar
                    title="Degree Courses"
                    userName={userData.name}
                    des={'Student'}
                    onLogout={() => navigation.replace('Login')}
                    showBackButton={true}
                    onBack={() => navigation.goBack()}
                />
                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <Text style={styles.errorIconText}>⚠</Text>
                    </View>
                    <Text style={styles.errorText}>Something went wrong</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => navigation.replace('DegreeCourses')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Navbar
                title="Degree Courses"
                userName={userData.name}
                des={'Student'}
                onLogout={() => navigation.replace('Login')}
                showBackButton={true}
                onBack={() => navigation.goBack()}
            />
            
            <View style={styles.content}>
                <View style={styles.headerSection}>
                    <Text style={styles.programTitle}>{userData.Program}</Text>
                    <View style={styles.intakeTag}>
                        <Text style={styles.intakeText}>{userData.InTake}</Text>
                    </View>
                </View>
                
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search courses by name or code..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>
                </View>
                
                {filteredCourses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>📚</Text>
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery ? 'No matches found' : 'No courses available'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery ? 'Try adjusting your search terms' : 'Courses will appear here once available'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView 
                        style={styles.coursesContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {filteredCourses.map((semesterCourses, index) => 
                            renderSemester(semesterCourses, index)
                        )}
                        <View style={styles.bottomPadding} />
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    programTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    intakeTag: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    intakeText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
    },
    searchContainer: {
        marginBottom: 24,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 12,
        opacity: 0.6,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#000000', // Black text color
    },
    coursesContainer: {
        flex: 1,
    },
    semesterContainer: {
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    semesterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical:5,
        paddingHorizontal:15,
        backgroundColor: colors.primary,
    },
    semesterHeaderContent: {
        flex: 1,
    },
    semesterTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 2,
    },
    courseCount: {
        fontSize: 14,
        color: '#bfdbfe',
        fontWeight: '500',
    },
    expandIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    expandIconContainerExpanded: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    expandIcon: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    coursesListContainer: {
        backgroundColor: '#ffffff',
    },
    courseItem: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    courseCodeContainer: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        elevation: 2,
  
    },
    courseCode: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 12,
        textAlign: 'center',
    },
    courseInfo: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000', // Black text color
        marginBottom: 4,
        lineHeight: 22,
    },
    creditHours: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    arrowContainer: {
        marginLeft: 12,
    },
    arrow: {
        fontSize: 20,
        color: '#cbd5e1',
        fontWeight: '300',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorIconText: {
        fontSize: 24,
        color: '#dc2626',
    },
    errorText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyIconText: {
        fontSize: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },
    bottomPadding: {
        height: 20,
    },
});

export default Degree_Courses;