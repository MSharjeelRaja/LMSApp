import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Modal, 
  TextInput,
  Alert 
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import colors from '../ControlsAPI/colors';

const Grader = ({navigation, route}) => {
  const userData = route.params.userData;
  const [activeTab, setActiveTab] = useState('current');
  const [graders, setGraders] = useState({ active: [], previous: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedGrader, setSelectedGrader] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  useEffect(() => {
    const fetchGraders = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/Teachers/teacher-graders?teacher_id=${userData.id}`
        );
        const data = await response.json();
        if(data.status === 'success') {
          setGraders({
            active: data.active_graders,
            previous: data.previous_graders
          });
        }
      } catch (err) {
        setError('Failed to fetch graders');
      } finally {
        setLoading(false);
      }
    };

    fetchGraders();
  }, []);

  const handleFeedbackPress = (grader) => {
    setSelectedGrader(grader)
    setFeedbackText(grader.feedback || '')
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = async () => {
    try {
      setFeedbackLoading(true);
      Alert.alert("Success", "Feedback updated");
      
      const payload = {
        teacher_grader_id: selectedGrader.teacher_grader_id,
        feedback: feedbackText.trim() || null  
      };
  
      const response = await fetch(`${API_URL}/api/Teachers/add-or-update-feedbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const result = await response.json();
      
      if (result.status === "success") {
      
        const updateGrader = (g) => 
          g.teacher_grader_id === selectedGrader.teacher_grader_id
            ? { ...g, feedback: feedbackText.trim() } 
            : g;
  
        setGraders((prev) => ({
          active: prev.active.map(updateGrader),
          previous: Object.fromEntries(
            Object.entries(prev.previous).map(([session, graders]) => [
              session, 
              graders.map(updateGrader)
            ])
          ),
        }));
  
        setShowFeedbackModal(false);
    
       
      }
     
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

 
  const handleRequestGrader = async (grader) => {
    try {
      const response = await fetch(`${API_URL}/api/Admin/grader_req/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grader_id: grader.grader_id,
          teacher_id: userData.id
        }),
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        Alert.alert('Success', 'Grader request sent successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to send request');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send request');
    }
  };

  const renderGraderCard = (grader) => (
    <View key={grader.teacher_grader_id} style={styles.card}>
      <View style={styles.cardHeader}>
        {grader.image ? (
          <Image 
            source={{ uri: grader.image }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={[styles.avatar, styles.emptyAvatar]}>
            <Text style={styles.avatarText}>
              {grader.name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.regNo}>{grader.RegNo}</Text>
          <Text style={styles.name}>{grader.name}</Text>
          <Text style={styles.session}>{grader.session}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailLabel}>Section:</Text>
        <Text style={styles.detailValue}>{grader.section}</Text>
      </View>

      {grader.type && (
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={[styles.detailValue, styles.typeText]}>
            {grader.type}
          </Text>
        </View>
      )}

      <View style={styles.feedbackSection}>
  <Text style={styles.feedbackLabel}>Feedback:</Text>
  <Text style={styles.feedbackText}>
    {grader.feedback?.trim() || 'No feedback available'}
  </Text>
</View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.feedbackButton}
          onPress={() => handleFeedbackPress(grader)}
        >
          <Text style={styles.buttonText}>Feedback</Text>
        </TouchableOpacity>

        {activeTab === 'current' ? (
          <TouchableOpacity 
          
           
          >
          
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => handleRequestGrader(grader)}
          >
            <Text style={styles.buttonText}>Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Navbar
        title="Manage Grader"
        userName={userData.name}
        des={'Teacher'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={styles.tabText}>Current Graders ({graders.active.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'previous' && styles.activeTab]}
          onPress={() => setActiveTab('previous')}
        >
          <Text style={styles.tabText}>Previous Graders ({Object.values(graders.previous).flat().length})</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Feedback for {selectedGrader?.name}
            </Text>

            <TextInput
              style={styles.feedbackInput}
              multiline
              numberOfLines={4}
              placeholder="Enter your feedback..."
              value={feedbackText}
              onChangeText={setFeedbackText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowFeedbackModal(false)}
                disabled={feedbackLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitFeedback}
                disabled={feedbackLoading}
              >
                {feedbackLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'current' ? (
          graders.active.map(renderGraderCard)
        ) : (
          Object.entries(graders.previous).map(([session, sessionGraders]) => (
            <View key={session}>
              <Text style={styles.sessionHeader}>{session}</Text>
              {sessionGraders.map(renderGraderCard)}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default Grader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2a4d69',
    marginBottom: 15
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: colors.black,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 80
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2a4d69',
  },
  tabText: {
    color: '#4b86b4',
    fontWeight: '600',
  },
  content: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  emptyAvatar: {
    backgroundColor: '#4b86b4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  regNo: {
    color: '#2a4d69',
    fontWeight: '600',
    fontSize: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2a4d69',
  },
  session: {
    color: '#666',
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#4b86b4',
    fontWeight: '600',
  },
  detailValue: {
    color: '#2a4d69',
  },
  typeText: {
    textTransform: 'capitalize',
    color: '#28a745',
  },
  feedbackSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  feedbackLabel: {
    color: '#4b86b4',
    fontWeight: '600',
    marginBottom: 5,
  },
  feedbackText: {
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 15,
  },
  feedbackButton: {
    backgroundColor: '#4b86b4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  requestButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  sessionHeader: {
    color: '#2a4d69',
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 10,
    paddingLeft: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  error: {
    flex: 1,
    textAlign: 'center',
    color: 'red',
    marginTop: 20,
  },
});