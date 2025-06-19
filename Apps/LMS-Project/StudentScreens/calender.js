import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Navbar } from '../ControlsAPI/Comps';

const { width } = Dimensions.get('window');

const StudentCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  // Sample data based on your provided structure
  const sessionData = [
    { start_date: "2025-10-01", end_date: "2026-02-01", name: "Fall-2025" },
    { start_date: "2025-06-16", end_date: "2025-08-16", name: "Summer-2025" },
    { start_date: "2025-02-24", end_date: "2025-06-15", name: "Spring-2025" },
    { start_date: "2024-10-01", end_date: "2025-02-20", name: "Fall-2024" }
  ];

  const excludedDays = [
    { date: "2025-06-20", type: "Exam", Reason: "Final Exams Week" },
    { date: "2025-06-15", type: "Holiday", Reason: "Eid ul-Adha" },
    { date: "2025-05-20", type: "Exam", Reason: "Midterm Exams" },
    { date: "2025-05-11", type: "Holiday", Reason: "Updated due to national announcement" },
    { date: "2025-04-27", type: "Reschedule", Reason: "Friday classes rescheduled" },
    { date: "2025-04-19", type: "Reschedule", Reason: "Wednesday classes rescheduled" },
    { date: "2025-04-02", type: "Reschedule", Reason: "Tuesday classes rescheduled" },
    { date: "2025-03-23", type: "Holiday", Reason: "Pakistan Day" },
    { date: "2025-08-14", type: "Holiday", Reason: "Independence Day" },
    { date: "2025-07-01", type: "Session", Reason: "Summer Session Registration" }
  ];

  useEffect(() => {
    // Combine all events
    const allEvents = [];
    
    // Add session starts and ends
    sessionData.forEach(session => {
      allEvents.push({
        date: session.start_date,
        type: "Session",
        title: `${session.name} Starts`,
        description: `Academic session begins`
      });
      allEvents.push({
        date: session.end_date,
        type: "Session",
        title: `${session.name} Ends`,
        description: `Academic session concludes`
      });
    });

    // Add excluded days
    excludedDays.forEach(day => {
      allEvents.push({
        date: day.date,
        type: day.type,
        title: day.type === "Holiday" ? "Holiday" : 
               day.type === "Exam" ? "Examination" : "Rescheduled",
        description: day.Reason
      });
    });

    setEvents(allEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'Holiday': return '#4CAF50';
      case 'Exam': return '#F44336';
      case 'Session': return '#2196F3';
      case 'Reschedule': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'Holiday': return 'celebration';
      case 'Exam': return 'school';
      case 'Session': return 'schedule';
      case 'Reschedule': return 'warning';
      default: return 'event';
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.emptyDay} />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = formatDate(date) === formatDate(new Date());

      days.push(
        <View
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell
          ]}
        >
          <Text style={[styles.dayNumber, isToday && styles.todayText]}>
            {day}
          </Text>
          <View style={styles.eventContainer}>
            {dayEvents.slice(0, 2).map((event, idx) => (
              <View
                key={idx}
                style={[
                  styles.eventLabel,
                  { backgroundColor: getEventTypeColor(event.type) }
                ]}
              >
                <Text style={styles.eventLabelText}>
                  {event.type === 'Session' 
                    ? event.title.includes('Fall') ? 'Fall' 
                      : event.title.includes('Spring') ? 'Spring'
                      : event.title.includes('Summer') ? 'Summer'
                      : 'Session'
                    : event.type
                  }
                </Text>
              </View>
            ))}
            {dayEvents.length > 2 && (
              <Text style={styles.moreEvents}>+{dayEvents.length - 2}</Text>
            )}
          </View>
        </View>
      );
    }

    return days;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => new Date(event.date) >= today)
      .slice(0, 10);
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: monthNames[date.getMonth()].substring(0, 3),
      weekday: dayNames[date.getDay()]
    };
  };

  return (
    <ScrollView style={styles.container}>
      
      
    <Navbar
        title="Academic Calendar"
   
       
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />
      {/* Calendar Navigation */}
      <View style={styles.calendarContainer}>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={() => navigateMonth(-1)}
            style={styles.navButton}
          >
            <Icon name="chevron-left" size={24} color="#666" />
            <Text style={styles.navText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={() => navigateMonth(1)}
            style={styles.navButton}
          >
            <Text style={styles.navText}>Next</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaderContainer}>
          {dayNames.map(day => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {renderCalendarDays()}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend</Text>
        <View style={styles.legendGrid}>
          {[
            { type: 'Holiday', color: '#4CAF50' },
            { type: 'Exam', color: '#F44336' },
            { type: 'Session', color: '#2196F3' },
            { type: 'Reschedule', color: '#FF9800' }
          ].map(item => (
            <View key={item.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.type}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <Icon name="event" size={24} color="#2196F3" />
          <Text style={styles.eventsTitle}>Upcoming Important Events</Text>
        </View>

        {getUpcomingEvents().length > 0 ? (
          getUpcomingEvents().map((event, idx) => {
            const eventDate = formatEventDate(event.date);
            return (
              <View key={idx} style={styles.eventItem}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDay}>{eventDate.day}</Text>
                  <Text style={styles.eventMonth}>{eventDate.month}</Text>
                </View>
                
                <View style={styles.eventIcon}>
                  <Icon
                    name={getEventIcon(event.type)}
                    size={20}
                    color={getEventTypeColor(event.type)}
                  />
                </View>
                
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                  <Text style={styles.eventWeekday}>{eventDate.weekday}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noEvents}>
            <Icon name="event-note" size={48} color="#ccc" />
            <Text style={styles.noEventsText}>No upcoming events found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
 
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
 
  calendarContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  navText: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 4,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  dayHeaderContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 1,
    borderRadius: 4,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: (width - 64) / 7,
    height: 80,
  },
  dayCell: {
    width: (width - 64) / 7,
    height: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 4,
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  todayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  eventContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  eventLabel: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 1,
    minWidth: 30,
    alignItems: 'center',
  },
  eventLabelText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  moreEvents: {
    fontSize: 8,
    color: '#666',
    marginLeft: 2,
  },
  legendContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  eventsContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  eventDate: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  eventDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventMonth: {
    fontSize: 12,
    color: '#666',
  },
  eventIcon: {
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventWeekday: {
    fontSize: 12,
    color: '#999',
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noEventsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
});

export default StudentCalendar;