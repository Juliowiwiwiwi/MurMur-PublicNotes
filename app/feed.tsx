import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, LayoutAnimation, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from '../supabase';
import { AudioPlayerCard } from './components/AudioPlayerCard';
import { getRelativeTime } from './utils/time';

//greeting for header
const getGreeting = () => {
  const hr = new Date().getHours();
  if (hr < 12) return "Good Morning";
  if (hr < 18) return "Good Afternoon";
  return "Good Evening";
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Feed() {
  const { user } = useLocalSearchParams();
  const greeting = getGreeting();

  const [isExpanded, setExpanded] = useState(false);

  //Dates setting
  const dates = useMemo(() => {
    const _dates = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const yyyymmdd = `${year}-${month}-${day}`;

      _dates.push({
        day: d.toLocaleDateString('en-us', { weekday: "short" }),
        date: d.getDate().toString(),
        month: d.toLocaleDateString('en-us', { month: "short" }),
        full: d.toDateString(),
        normalized: yyyymmdd,
      });
    }
    return _dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dates[0].normalized);

  const currentSelected = dates.find(
    item => item.normalized === selectedDate
  );

  const toggleHeader = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!isExpanded);
  };

  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Text", "Image", "Audio"];

  const getFilteredNotes = () => {
    return notes;
  };


  const [isAddOpen, setAddOpen] = useState(false);
  const toggleAdd = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAddOpen(!isAddOpen);
  };

  const handleCreate = (type: string) => {
    toggleAdd();
    router.push({ pathname: "/create", params: { type, user } });
  };

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    
    // Calculate start and end of the selected date for server-side filtering
    const [year, month, day] = selectedDate.split('-');
    const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    let query = supabase
      .from('whispers')
      .select('*, profiles(avatar_url)')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (activeCategory !== "All") {
      query = query.eq('type', activeCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
    } else {
      setNotes(data || []);
    }

    if (user && !userAvatar) {
      const { data: profileData } = await supabase.from('profiles').select('avatar_url').eq('username', user).single();
      if (profileData?.avatar_url) setUserAvatar(profileData.avatar_url);
    }

    setLoading(false);
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [activeCategory, selectedDate]);



  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: `${greeting}, ${user}`,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginRight: 15 }}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={{ width: 35, height: 35, borderRadius: 17.5, borderWidth: 1, borderColor: '#333' }} />
              ) : (
                <View style={{ width: 35, height: 35, borderRadius: 17.5, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{(user as string)?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }}
      />
      {/*This will be the permanent Header.,trigger(rhymes with a funny word) and the calendar will be wrapped in modal */}
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
          <View style={styles.calendarPopout} onStartShouldSetResponder={() => true}>
            <View style={styles.popoutHeader}>
              <Text style={styles.popoutTitle}>History</Text>
              <TouchableOpacity onPress={toggleHeader} style={styles.doneButton}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((item) => {
                const isSelected = selectedDate === item.normalized
                return (
                  <TouchableOpacity
                    key={item.normalized}
                    onPress={() => setSelectedDate(item.normalized)}
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
        <ScrollView style={styles.filterScroll} horizontal showsHorizontalScrollIndicator={false} >
          {categories.map((cat) => {
            const isSelectedCat = activeCategory === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
                style={[styles.pill, isSelectedCat && styles.activePill]}>
                <Text style={[styles.pillText, isSelectedCat && styles.activePillText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>






      {/* The main notes part */}
      <FlatList data={getFilteredNotes()}
        keyExtractor={(item => item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10, }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
          ) : (
            <Text style={styles.TemporaryNotessection}>No whispers found.</Text>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.noteCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/[id]', params: { id: item.id, user } })}>
            <View style={styles.cardHeader}>
              <Text style={styles.authorText}>@{item.author}</Text>
              <Text style={styles.timeText}>{getRelativeTime(item.created_at)}</Text>
            </View>
            {item.type !== "Audio" && item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
            {item.content ? <Text style={styles.cardContent}>{item.content}</Text> : null}

            {item.type === "Image" && item.media_url && (
              <View style={styles.noteImageContainer}>
                <Image
                  source={{ uri: item.media_url }}
                  style={styles.noteImage}
                  resizeMode="cover" />
              </View>
            )}
            {item.type === "Audio" && item.media_url && (
              <AudioPlayerCard uri={item.media_url} title={item.title} author={item.author} avatarUrl={item.profiles?.avatar_url} />
            )}
          </TouchableOpacity>
        )} />



      {/* creating note part */}
      {isAddOpen && (
        <TouchableOpacity
          style={styles.addOverlay}
          activeOpacity={1}
          onPress={toggleAdd}
        />
      )}
      {isAddOpen && (
        <View style={styles.addMenu}>
          <TouchableOpacity style={styles.miniAdd} onPress={() => handleCreate('Audio')}>
            <Text style={styles.miniAddText}>Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniAdd} onPress={() => handleCreate('Image')}>
            <Text style={styles.miniAddText}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniAdd} onPress={() => handleCreate('Text')}>
            <Text style={styles.miniAddText}>Text</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.add}
        activeOpacity={0.8}
        onPress={toggleAdd}>
        <Text style={[styles.addIcon, isAddOpen && { transform: [{ rotate: '45 deg' }] }]}>+</Text>
      </TouchableOpacity>



    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerWrapper: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
  },
  closedContainer: {
    paddingVertical: 10,
  },
  todayText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  tapHint: {
    color: '#a1a1a1',
    fontSize: 14,
    marginTop: 4,
  },
  openContainer: {
    paddingBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    marginVertical: 150,
    alignItems: 'center',
  },
  calendarPopout: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#000000ff',
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
    backgroundColor: '#000000ff',
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
  TemporaryNotessection: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    padding: 30,
    margin: 15,
  },
  emptyBox: {
    textAlign: 'center',
    backgroundColor: '#08ded6',
    padding: 20,
    margin: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  boxText: {
    color: '#000000',
    fontSize: 18,
    textAlign: 'center',
    padding: 30,
    margin: 15,
    fontWeight: 'bold',
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
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  pillText: {
    color: '#a1a1a1',
    fontWeight: '600',
    fontSize: 14,
  },
  activePillText: {
    color: '#000',
  },
  noteCard: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  authorText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardContent: {
    color: '#efefef',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  noteImageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  noteImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,

  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131441',
    padding: 12,
    borderRadius: 15,
    marginBottom: 12,
  },
  playButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  playIcon: { color: '#000', fontSize: 14, marginLeft: 2 },
  waveFormPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveBar: {
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  footerText: { color: '#666', fontSize: 12 },
  add: {
    position: 'absolute',
    bottom: 30, // 
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 20,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addIcon: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  addMenu: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    alignItems: 'flex-end',
    zIndex: 20,
    elevation: 20,

  },
  miniAdd: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  miniAddText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
    elevation: 10,
  },
});
