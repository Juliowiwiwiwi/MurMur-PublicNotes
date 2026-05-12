import { useMemo, useState } from "react";
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

if(Platform.OS==="android" &&UIManager.setLayoutAnimationEnabledExperimental){
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Feed() {
  
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



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        {!isExpanded ? (
          <TouchableOpacity onPress={toggleHeader} style={styles.closedContainer}>
            <Text style={styles.todayText}>
              {currentSelected!.day},{currentSelected!.month},{currentSelected!.date}
              {/* //basically im using ! to say "trust me bro it exist" cuz sometimes it can fail like when currentselected is random and .find() doesnt find naythin*/}
            </Text>
            <Text style={styles.tapHint}>Tap to view history</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.openContainer}>
            <TouchableOpacity onPress={toggleHeader} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity> 
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
                )
              })
              
              }
            </ScrollView>
          </View>
        )
        }
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
  doneButton: {
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: '#131441', // Your Indigo button color
    borderRadius: 12,
    marginBottom: 15,
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
});
