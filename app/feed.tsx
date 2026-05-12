import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

//greeting for header
const getGreeting = () => {
  const hr = new Date().getHours();
  if(hr < 12) return "Good Morning";
  if(hr < 18) return "Good Afternoon";
  return "Good Evening";
};

if(Platform.OS==="android" &&UIManager.setLayoutAnimationEnabledExperimental){
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Feed() {
  const {user}=useLocalSearchParams();
  const greeting = getGreeting();
  
  const [isExpanded, setExpanded]=useState(false);

  //Dates setting
  const dates=useMemo(() => {
    const _dates=[];
    for (let i=0; i<14 ;i++){
      const d = new Date();
      d.setDate(d.getDate()-i);
      _dates.push({
        day:d.toLocaleDateString('en-us', {weekday:"short"}),
        date:d.getDate().toString(),
        month:d.toLocaleDateString('en-us',{month:"short"}),
        full:d.toDateString(),
      });
    }
    return _dates;
  },[]);

  const[selectedDate,setSelectedDate]=useState(dates[0].full);

  const currentSelected = dates.find(
    item => item.full === selectedDate
  );

  const toggleHeader=()=>{
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!isExpanded);
  };

  const [activeCategory, setActiveCategory]=useState("All");
  const categories = ["All","Text","Image","Audio"];




  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{headerTitle:`${greeting}, ${user}`}} />
      {/*This will be the permanent Header. Trigger and the calendar will be wrapped in modal */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={toggleHeader} style={styles.closedContainer}>
          <Text style={styles.todayText}>
            {currentSelected!.day},{currentSelected!.month},{currentSelected!.date}
            {/* //basically im using ! to say "trust me bro it exist" cuz sometimes it can fail like when currentselected is random and .find() doesnt find naythin*/}
          </Text>
          <Text style={styles.tapHint}>Tap to view history</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isExpanded}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleHeader}
    >
        <TouchableOpacity onPress={toggleHeader} style={styles.modalOverlay} activeOpacity={1}>
          {/* THE MAIN FLOATING CARD */}
          <View style={styles.calendarPopout} onStartShouldSetResponder={()=>true}>
            <View style={styles.popoutHeader}>
              <Text style={styles.popoutTitle}>History</Text>
              <TouchableOpacity onPress={toggleHeader} style={styles.doneButton}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((item) =>{
                const isSelected = selectedDate===item.full
                return(
                  <TouchableOpacity
                    key={item.full}
                    onPress={()=>setSelectedDate(item.full)}
                    style={[styles.dateCard, isSelected && styles.activeCard]}
                  >
                    <Text style={[styles.dayText, isSelected && styles.activeText]}>{item.day}</Text>
                    <Text style={[styles.dateNumber, isSelected && styles.activeText]}>{item.date}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
        




      {/* The category thing scroller for all image text audio */}
      <View style={styles.filterSection}>
        <ScrollView style ={styles.filterScroll}  horizontal showsHorizontalScrollIndicator={false} >
          {categories.map((cat) =>{
            const isSelectedCat= activeCategory=== cat;
            return (
              <TouchableOpacity key ={cat} onPress={()=>setActiveCategory(cat)} 
              style={[styles.pill,isSelectedCat&&styles.activePill]}>
                <Text style={[styles.pillText,isSelectedCat&&styles.activePillText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            )})}
        </ScrollView>
      </View>

      
      <View>
        {/* the notes part to build later */}
        <Text style={styles.TemporaryNotessection}>No Whispers For {currentSelected?.day}</Text>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Keeps the black theme
  },
  headerWrapper: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderColor: '#1a1a1a', // Subtle divider
  },
  // CLOSED STATE
  closedContainer: {
    paddingVertical: 10,
  },
  todayText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900', // Bold logo-style weight
  },
  tapHint: {
    color: '#a1a1a1',
    fontSize: 14,
    marginTop: 4,
  },
  // OPEN STATE
  openContainer: {
    paddingBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dims the rest of the screen
    justifyContent: 'flex-start',
    marginVertical:150, // Centers the card vertically
    alignItems: 'center',
  },
  calendarPopout: {
    width: '90%',
    backgroundColor: '#1a1a1a', // Same dark gray as your inputs
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    // Elevation for Android / Shadow for iOS
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  popoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  popoutTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#131441',
    borderRadius: 10,
  },
  doneText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginRight: 15,
    borderRadius: 15,
    backgroundColor: '#1a1a1a',
    minWidth: 60,
  },
  activeCard: {
    backgroundColor: '#6366f1', // when date is chosen
  },
  dayText: {
    color: '#a1a1a1',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  dateNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  activeText: {
    color: '#fff',
  },
  TemporaryNotessection:{
    color:'#fff',
    fontSize:18,
    textAlign:'center',
    padding:30,
    margin:15,
  },
  filterSection: {
    marginTop: 10,
  },
  filterScroll: {
    paddingHorizontal: 25,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  activePill: {
    backgroundColor: '#fff', // White pill when selected
    borderColor: '#fff',
  },
  pillText: {
    color: '#a1a1a1',
    fontWeight: '600',
    fontSize: 14,
  },
  activePillText: {
    color: '#000', // Black text on white pill
  },
});
