import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Dimensions,
  Image,
  Modal,
  TextInput
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL } from '../ControlsAPI/Comps';
import img from '../images/as.png';
import colors from '../ControlsAPI/colors';

const { width, height } = Dimensions.get('window');

const AddseatingPlan = ({ route, navigation }) => {
  const { classData, apiResponse } = route.params;
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classroomLayout, setClassroomLayout] = useState([]);
  const [tempRows, setTempRows] = useState('6');
  const [tempCols, setTempCols] = useState('5');
  const [layoutConfig, setLayoutConfig] = useState({ rows: 6, cols: 5 });
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  // Calculate dynamic seat size based on columns
  const getSeatSize = () => {
    const maxColumns = 5; // Base number of columns
    const columnCount = Math.max(layoutConfig.cols, 1); // Ensure at least 1 column
    const scaleFactor = columnCount > maxColumns ? maxColumns / columnCount : 1;
    const baseSize = width * 0.18; // Base size for 5 columns
    
    return {
      width: baseSize * scaleFactor,
      height: baseSize * scaleFactor,
      fontSize: Math.max(10 * scaleFactor, 8), // Minimum font size of 8
      avatarSize: Math.max(28 * scaleFactor, 20) // Minimum avatar size of 20
    };
  };

  // Initialize classroom layout
  const initializeLayout = (rows, cols) => {
    if (!apiResponse?.students) return;

    const assignedStudents = [];
    const unassignedStudents = [];

    apiResponse.students.forEach(student => {
      if (student.SeatNumber) {
        assignedStudents.push(student);
      } else {
        unassignedStudents.push(student);
      }
    });

    const layout = Array.from({ length: rows }, (_, rowIndex) => {
      return Array.from({ length: cols }, (_, colIndex) => {
        const seatNumber = rowIndex * cols + colIndex + 1;
        const student = assignedStudents.find(s => s.SeatNumber === seatNumber);
        return { seatNo: seatNumber, student: student || null };
      });
    });

    setClassroomLayout(layout);
    setStudents(unassignedStudents);
  };

  useEffect(() => {
    initializeLayout(layoutConfig.rows, layoutConfig.cols);
  }, [apiResponse, layoutConfig]);

  const handleChangeLayout = () => {
    setTempRows(layoutConfig.rows.toString());
    setTempCols(layoutConfig.cols.toString());
    setShowLayoutModal(true);
  };

  const applyNewLayout = () => {
    const newRows = parseInt(tempRows) || 6;
    const newCols = parseInt(tempCols) || 5;
    
    if (newRows > 0 && newCols > 0) {
      setLayoutConfig({ rows: newRows, cols: newCols });
      setShowLayoutModal(false);
    } else {
      Alert.alert('Invalid Input', 'Rows and columns must be positive numbers');
    }
  };

  const handleSeatSelect = (seat) => {
    if (!selectedStudent) return;

    setClassroomLayout(prevLayout => {
      return prevLayout.map(row => row.map(s => {
        if (s.student?.student_id === selectedStudent.student_id) {
          setStudents(prev => [...prev, s.student]);
          return { ...s, student: null };
        }
        if (s.seatNo === seat.seatNo) {
          const previousStudent = s.student;
          if (previousStudent) {
            setStudents(prev => [...prev, previousStudent]);
          }
          return { ...s, student: selectedStudent };
        }
        return s;
      }));
    });

    setStudents(prev => prev.filter(s => s.student_id !== selectedStudent.student_id));
    setSelectedStudent(null);
  };

  const handleSubmit = async () => {
    try {
      const assignedStudents = classroomLayout.flatMap(row => 
        row.filter(seat => seat.student).map(seat => ({
          student_id: seat.student.student_id,
          seatNo: seat.seatNo
        }))
      );

      const payload = {
        teacher_offered_course_id: classData.teacher_offered_course_id,
        students: assignedStudents
      };

      const response = await fetch(`${API_URL}/api/JuniorLec/add-sequence-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Seating plan saved successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message || 'Failed to save seating plan');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save seating plan');
      console.error('Submission error:', error);
    }
  };

  const renderStudentItem = (student) => (
    <TouchableOpacity
      key={student.student_id}
      style={[
        styles.studentCard,
        selectedStudent?.student_id === student.student_id && styles.selectedStudent
      ]}
      onPress={() => setSelectedStudent(student)}
    >
      <Image
        source={student.image ? { uri: student.image } : img}
        style={styles.studentImage}
      />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {student.name.replace(/Muhammad/g, 'M.')}
        </Text>
        <Text style={styles.studentDetails} numberOfLines={1}>
          {student.RegNo}
        </Text>
      </View>
      <Icon 
        name={selectedStudent?.student_id === student.student_id ? "check-circle" : "touch-app"} 
        size={20} 
        color="#FF6B6B" 
      />
    </TouchableOpacity>
  );

  const renderSeat = (seat) => {
    const seatSize = getSeatSize();
    
    return (
      <TouchableOpacity
        key={seat.seatNo}
        style={[
          styles.seatCard,
          {
            width: seatSize.width,
            height: seatSize.height,
          },
          seat.student && styles.occupiedSeat,
          selectedStudent && styles.activeSeat
        ]}
        onPress={() => handleSeatSelect(seat)}
      >
        {seat.student ? (
          <>
            <Image
              source={seat.student.image ? { uri: seat.student.image } : img}
              style={[styles.seatAvatar, { width: seatSize.avatarSize, height: seatSize.avatarSize }]}
            />
            <Text style={[styles.seatName, { fontSize: seatSize.fontSize }]} numberOfLines={2}>
              {seat.student.name.replace(/Muhammad/g, 'M.')}
            </Text>
            <Text style={[styles.seatNumber, { fontSize: seatSize.fontSize - 1 }]}>
              Seat {seat.seatNo}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.emptySeatNumber, { fontSize: seatSize.fontSize + 4 }]}>
              {seat.seatNo}
            </Text>
            {selectedStudent && <Icon name="add-circle" size={seatSize.avatarSize * 0.7} color="#4ECDC4" />}
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Seating Plan - {classData.section}</Text>
        <TouchableOpacity onPress={handleChangeLayout}>
          <Icon name="tune" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.classroomPanel}>
          <View style={styles.panelHeader}>
            <Icon name="class" size={20} color="#FFF" />
            <Text style={styles.panelTitle}>Classroom Layout ({layoutConfig.rows}x{layoutConfig.cols})</Text>
          </View>
          <ScrollView 
            contentContainerStyle={styles.classroomGrid}
            showsVerticalScrollIndicator={false}
          >
            {classroomLayout.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.seatRow}>
                {row.map(seat => renderSeat(seat))}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Unassigned Students */}
        <View style={styles.studentPanel}>
          <View style={styles.panelHeader}>
            <Icon name="people" size={20} color="#FFF" />
            <Text style={styles.panelTitle}>Unassigned ({students.length})</Text>
          </View>
          <ScrollView 
            contentContainerStyle={styles.studentList}
            showsVerticalScrollIndicator={false}
          >
            {students.map(renderStudentItem)}
            {students.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="check-circle" size={32} color="#4ECDC4" />
                <Text style={styles.emptyText}>All students assigned!</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Layout Configuration Modal */}
      <Modal
        visible={showLayoutModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Classroom Layout</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Rows:</Text>
              <TextInput
                style={styles.input}
                value={tempRows}
                onChangeText={setTempRows}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Columns:</Text>
              <TextInput
                style={styles.input}
                value={tempCols}
                onChangeText={setTempCols}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLayoutModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.applyButton]}
                onPress={applyNewLayout}
              >
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Icon name="save" size={24} color="#FFF" />
        <Text style={styles.submitText}>Save Seating Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FFF7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    elevation: 3,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    padding: 8,
  },
  studentPanel: {
    flex: 1,
    backgroundColor: colors.blueGray,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: height * 0.35,
  },
  classroomPanel: {
    flex: 2,
    backgroundColor: colors.blueSky,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  panelTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  studentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  studentCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    elevation: 2,
  },
  selectedStudent: {
    borderWidth: 2,
    borderColor: colors.green1,
  },
  studentImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#EEE',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: '#2D3047',
    fontWeight: '500',
    fontSize: 14,
  },
  studentDetails: {
    color: '#6C757D',
    fontSize: 10,
  },
  emptyState: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#2D3047',
    fontWeight: '600',
    marginTop: 8,
  },
  classroomGrid: {
    padding: 4,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  seatCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 2,
    elevation: 2,
    margin: 1,
  },
  occupiedSeat: {
    backgroundColor: colors.orange,
  },
  activeSeat: {
    borderWidth: 2,
    borderColor: colors.green1,
  },
  seatAvatar: {
    borderRadius: 14,
    marginBottom: 2,
  },
  seatName: {
    color: '#FFF',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  seatNumber: {
    color: colors.black,
    fontWeight: '600',
    marginTop: 1,
  },
  emptySeatNumber: {
    color: '#2D3047',
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    padding: 12,
    margin: 4,
    borderRadius: 8,
    width: '80%',
    alignSelf: 'center',
    elevation: 3,
  },
  submitText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2D3047',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    color: colors.black,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    color: colors.black,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.red1,
  },
  applyButton: {
    backgroundColor: colors.green2,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default AddseatingPlan;