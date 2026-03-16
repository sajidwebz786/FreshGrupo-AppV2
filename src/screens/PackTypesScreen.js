import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import FarmerAnimation from '../components/FarmerAnimation';

const PackTypesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { category } = route.params || {};
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [packOffers, setPackOffers] = useState([]);
  const scrollViewRef = useRef(null);
  const autoScrollInterval = useRef(null);

  console.log('PackTypesScreen route params:', route.params);
  console.log('PackTypesScreen category:', category);

  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Default pack offers fallback when API doesn't return data
  const defaultPackOffers = [
    { id: 1, category: 'Weekly Pack', image: require('../images/12.jpeg'), discount: '15% OFF on', title: 'Weekly Pack Special Offer' },
    { id: 2, category: 'Bi-Weekly Pack', image: require('../images/13.jpeg'), discount: '20% OFF on', title: 'Bi-Weekly Pack Launch Offer' },
    { id: 3, category: 'Monthly Pack', image: require('../images/14.jpeg'), discount: '25% OFF on', title: 'Monthly Pack Mega Offer' },
    { id: 4, category: 'Premium Pack', image: require('../images/15.jpeg'), discount: '30% OFF on', title: 'Premium Pack Exclusive Deal' },
    { id: 5, category: 'Seasonal Pack', image: require('../images/16.jpeg'), discount: '35% OFF on', title: 'Seasonal Pack Limited Time' },
  ];

  // Use dynamic offers if available, otherwise use default
  const displayPackOffers = packOffers.length > 0 ? packOffers : defaultPackOffers;

  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollInterval.current = setInterval(() => {
        setActiveSlide(prev => {
          const next = (prev + 1) % displayPackOffers.length;
          scrollViewRef.current?.scrollTo({ x: next * Dimensions.get('window').width, animated: true });
          return next;
        });
      }, 4000);
    };
    startAutoScroll();
    return () => clearInterval(autoScrollInterval.current);
  }, []);

  const handleScrollBegin = () => clearInterval(autoScrollInterval.current);
  const handleScrollEnd = () => {
    clearInterval(autoScrollInterval.current);
    autoScrollInterval.current = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % displayPackOffers.length;
        scrollViewRef.current?.scrollTo({ x: next * Dimensions.get('window').width, animated: true });
        return next;
      });
    }, 4000);
  };

  useEffect(() => {
    console.log('PackTypesScreen mounted with category:', category);
    fetchPacks();
    fetchPackOffers();
  }, [category]);

  // Fetch pack offers dynamically from API
  const fetchPackOffers = async () => {
    try {
      const response = await api.getOffers();
      if (Array.isArray(response) && response.length > 0) {
        setPackOffers(response);
      }
    } catch (error) {
      console.error('Error fetching pack offers:', error);
      // Falls back to defaultPackOffers on error
    }
  };

  const fetchPacks = async () => {
    try {
      setLoading(true);
      console.log('Fetching packs for category:', category);
      // Find category by name to get ID
      const categories = await api.getCategories();
      const selectedCategory = categories.find(cat => cat.name === category);
      console.log('Selected category:', selectedCategory);

      if (selectedCategory) {
        const data = await api.getPacksByCategory(selectedCategory.id);
        console.log('Packs data:', data);
        setPacks(data);
      } else {
        console.log('Category not found:', category);
        Alert.alert('Error', `Category "${category}" not found`);
      }
    } catch (error) {
      console.error('Error fetching packs:', error);
      Alert.alert('Error', 'Failed to fetch packs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && packs.length > 0) {
      const animations = cardAnimations.map((anim, i) =>
        Animated.spring(anim, { toValue: 1, tension: 50, friction: 7, delay: i * 150, useNativeDriver: true })
      );
      Animated.stagger(100, animations).start();
    }
  }, [loading, packs]);

  const handleSelectPack = pack => {
    navigation.navigate('PackContents', {
      category: category,
      packType: pack.PackType.name,
      packId: pack.id,
      duration: pack.PackType.duration,
    });
  };

  if (!category) {
    return (
      <View style={styles.centeredContainer}>
        <Text>No category selected</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <ImageBackground
        source={require('../images/clean_app_bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading packs...</Text>
        </View>
      </ImageBackground>
    );
  }

  // Dynamic pack types from API - no hardcoded packs
  const getAvailablePackTypes = cat => {
    // Return empty array - packs will come from API
    return [];
  };

  const packTypes = packs.length > 0 ? packs : getAvailablePackTypes(category);

  // Use packs from API directly - no merging with hardcoded data
  const displayPacks = packs.map(pack => {
    // Calculate price from products if available
    let packPrice = '';
    let finalPrice = 0;
    
    // First check if sellingPrice is available (this is the price shown to customers)
    if (pack.sellingPrice && pack.sellingPrice > 0) {
      packPrice = `₹${Math.round(pack.sellingPrice).toLocaleString('en-IN')}`;
      finalPrice = pack.sellingPrice;
    } else if (pack.Products && pack.Products.length > 0) {
      const totalPrice = pack.Products.reduce((sum, item) => {
        const price = item.PackProduct?.unitPrice || item.price || 0;
        const qty = item.PackProduct?.quantity || 1;
        return sum + (price * qty);
      }, 0);
      
      if (totalPrice > 0) {
        packPrice = `₹${Math.round(totalPrice).toLocaleString('en-IN')}`;
        finalPrice = totalPrice;
      }
    }
    
    // Fallback to pack's finalPrice
    if (!packPrice && pack.finalPrice > 0) {
      packPrice = `₹${Math.round(pack.finalPrice).toLocaleString('en-IN')}`;
      finalPrice = pack.finalPrice;
    }
    
    // Fallback to PackType basePrice
    if (!packPrice && pack.PackType?.basePrice > 0) {
      packPrice = `₹${Math.round(pack.PackType.basePrice).toLocaleString('en-IN')}`;
      finalPrice = pack.PackType.basePrice;
    }
    
    // Get description from PackType if available
    const description = pack.PackType?.duration 
      ? `${pack.PackType.persons || '1-2 Persons'} | ${pack.PackType.days || '3-4 Days'}`
      : pack.description || 'Available Pack';
    
    return {
      name: pack.name, // Use actual pack name from database (e.g., 'Small Fruit Pack')
      description: description,
      // Use dynamic color from PackType if available, otherwise fallback to default green
      color: pack.PackType?.color || '#2E7D32',
      gradientColors: pack.PackType?.color 
        ? [pack.PackType.color, pack.PackType.color, pack.PackType.color]
        : ['#66BB6A', '#43A047', '#2E7D32'],
      duration: pack.PackType?.duration || 'small',
      available: true,
      price: packPrice || 'N/A',
      finalPrice: finalPrice,
      apiPackId: pack.id,
      badge: 'Available'
    };
  });


  return (
    <View style={styles.mainContainer}>
      {/* Only status bar green; rest is normal */}
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>
      <ImageBackground source={require('../images/innerimage.png')} style={styles.background} resizeMode="cover" opacity={0.1}>
        <View style={styles.scrollContainer}>
          {/* Farmer with Bulls - Full Width Hero Image */}
          <View style={styles.animationContainer}>
            <FarmerAnimation />
          </View>

          {/* Branded Title Section - Text Background Only */}
          <View style={styles.titleContainer}>
            <View style={styles.titleTextBackground}>
              <Text style={styles.title}>Choose Your {category}</Text>
              <Text style={styles.subtitle}>Select a delivery plan that works for you</Text>
            </View>
            <Text style={styles.tapGuidance}>👆 Tap on a pack to select</Text>
          </View>

          {/* Pack Cards - Dynamic from Database */}
          <View style={styles.packsContainer}>
            <View style={styles.categoriesGrid}>
            {displayPacks.length > 0 ? (
              displayPacks.map((pack, i) => (
                <View key={i} style={styles.cardWithBadgeContainer}>
                  <Animated.View
                    style={[
                      styles.categoryCard,
                      {
                        opacity: pack.available ? cardAnimations[i] : 0.5,
                        transform: pack.available
                          ? [
                              { scale: cardAnimations[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                              { translateY: cardAnimations[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                            ]
                          : [],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.cardTouchable}
                      disabled={!pack.available}
                      onPress={() => {
                        // Navigate to PackContents with actual pack from database
                        navigation.navigate('PackContents', {
                          category: category,
                          packType: pack.name,
                          duration: pack.duration,
                          packId: pack.apiPackId,
                        });
                      }}
                    >
                      <LinearGradient
                        colors={pack.gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBackground}
                      >
                        <Text style={styles.categoryTitle}>{pack.name}</Text>
                        <Text style={styles.categoryText}>{pack.description}</Text>
                        <View style={styles.priceContainer}>
                          <Text style={styles.priceText}>{pack.price}</Text>
                        </View>
                        {!pack.available && <Text style={styles.unavailableText}>Coming Soon</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                  {/* Badge outside card in white space */}
                  {pack.badge && (
                    <View style={styles.outsideBadgeContainer}>
                      <Text style={styles.outsideBadgeText}>{pack.badge}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noPacksContainer}>
                <Text style={styles.noPacksText}>No packs available for this category</Text>
              </View>
            )}
          </View>
          </View>

          {/* Logo at Top - Under Header */}
          <View style={styles.topLogoContainer}>
            <Image source={require('../images/logo.png')} style={styles.topLogo} />
          </View>

          {/* Branded Title Section - Text Background Only */}
        </View>
      </ImageBackground>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  background: { flex: 1 },
  scrollContainer: { flex: 1, paddingBottom: 100 },  // reduced padding to accommodate logo


  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: 'white', marginTop: 10, textAlign: 'center' },
  
  // Animation Container - Full Width
  animationContainer: { 
    marginVertical: 0,
    height: 80, // Reduced height to make room for cards
  },
  
  // Branded Title Section - No Background
  titleContainer: {
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  titleTextBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  tapGuidance: {
    fontSize: 15,
    color: '#4CAF50',
    marginTop: 15,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 3, 
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  topLogoContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  topLogo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },

  // Logo at Bottom (removed)
  bottomLogoContainer: {
    display: 'none',
  },
  bottomLogo: {
    display: 'none',
  },
  
  // Pack Cards Container
  packsContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  
  // Pack Cards - 2x2 Grid Layout
  categoriesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    gap: 10,
  },
  cardWithBadgeContainer: {
    width: '47%',
    alignItems: 'center',
    marginBottom: 5,
  },
  
  // Individual Card - Smaller for 2x2 Grid
  categoryCard: { 
    width: '100%', 
    height: 140, 
    marginVertical: 4, 
    borderRadius: 18, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 6,
    overflow: 'hidden',
  },
  cardTouchable: { 
    width: '100%', 
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  badgeContainer: {
    display: 'none',
  },
  badgeText: {
    display: 'none',
  },
  badgeContainer: {
    display: 'none',
  },
  badgeText: {
    display: 'none',
  },
  outsideBadgeContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  outsideBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  packIcon: {
    display: 'none',
  },
  categoryTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 6, 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryText: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.95)', 
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emojiIndicator: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailsContainer: {
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  detailText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 1,
  },
  priceContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginTop: 10,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  unavailableText: { 
    fontSize: 11, 
    color: '#999', 
    textAlign: 'center', 
    marginTop: 10, 
    fontStyle: 'italic' 
  },
  noPacksContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPacksText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default PackTypesScreen;