import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {useRoute, useNavigation} from '@react-navigation/native';
import api from '../services/api';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import FarmerAnimation from '../components/FarmerAnimation';

const PackTypesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {category} = route.params || {};
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardAnimations = useRef([]);

  useEffect(() => {
    fetchPacks();
  }, [category]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      // Find category by name to get ID
      const categories = await api.getCategories();
      const selectedCategory = categories.find(cat => cat.name === category);

      if (selectedCategory) {
        const data = await api.getPacksByCategory(selectedCategory.id);
        setPacks(data);
      } else {
        Alert.alert('Error', `Category "${category}" not found`);
      }
    } catch (error) {
      console.error('Error fetching packs:', error);
      Alert.alert(
        'Error',
        'Failed to fetch packs. Please check your connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && packTypes?.length) {
      cardAnimations.current = packTypes.map(
        (_, i) => cardAnimations.current[i] || new Animated.Value(0),
      );

      const animations = cardAnimations.current.map((anim, i) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: i * 150,
          useNativeDriver: true,
        }),
      );

      Animated.stagger(120, animations).start();
    }
  }, [loading, packs]);

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
        resizeMode="cover">
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading packs...</Text>
        </View>
      </ImageBackground>
    );
  }

  // UI styling for packs
  const getPackUI = duration => {
    const uiMap = {
      small: {
        color: '#2E7D32',
        gradientColors: ['#66BB6A', '#43A047', '#2E7D32'],
        badge: 'Best Value',
      },
      medium: {
        color: '#E65100',
        gradientColors: ['#FFB74D', '#F57C00', '#E65100'],
        badge: 'Popular',
      },
      large: {
        color: '#C62828',
        gradientColors: ['#EF5350', '#E53935', '#C62828'],
        badge: 'Premium',
      },
    };

    return (
      uiMap[duration] || {
        color: '#455A64',
        gradientColors: ['#90A4AE', '#607D8B', '#455A64'],
        badge: null,
      }
    );
  };

  // showing defaultly custom pack
  // const packTypes = [
  //   ...packs.map(pack => {
  //     const duration = pack.PackType?.duration;
  //     const ui = getPackUI(duration);

  //     const price = pack.finalPrice || pack.PackType?.basePrice || 0;

  //     return {
  //       name: pack.name,
  //       description: pack.description || '',
  //       duration: duration,
  //       available: true,
  //       price: `₹${Math.round(price).toLocaleString('en-IN')}`,
  //       apiPackId: pack.id,
  //       ...ui,
  //     };
  //   }),

  //   // Always add Custom Pack
  //   {
  //     name: `Custom ${category}`,
  //     description: 'Build your own pack',
  //     duration: 'custom',
  //     available: true,
  //     price: 'Customize',
  //     gradientColors: ['#BA68C8', '#8E24AA', '#6A1B9A'],
  //     badge: 'Customize',
  //   },
  // ];

// If you want to only show custom pack when there are other packs

  // Sort packs by duration type: Small -> Medium -> Large -> Custom
  const sortPacksByDuration = (a, b) => {
    const durationOrder = { small: 1, medium: 2, large: 3 };
    const orderA = durationOrder[a.PackType?.duration] || 4;
    const orderB = durationOrder[b.PackType?.duration] || 4;
    return orderA - orderB;
  };

  // Sort packs by duration type before mapping
  const sortedPacks = [...packs].sort(sortPacksByDuration);

  const packTypes =
  sortedPacks.length > 0
    ? [
        ...sortedPacks.map(pack => {
          const duration = pack.PackType?.duration;
          const ui = getPackUI(duration);

          const price = pack.finalPrice || pack.PackType?.basePrice || 0;

          return {
            name: pack.name,
            description: pack.description || '',
            duration: duration,
            available: true,
            price: `₹${Math.round(price).toLocaleString('en-IN')}`,
            apiPackId: pack.id,
            ...ui,
          };
        }),

        // add custom pack ONLY when packs exist
        {
          name: `Custom ${category}`,
          description: 'Build your own pack',
          duration: 'custom',
          available: true,
          price: 'Customize',
          gradientColors: ['#BA68C8', '#8E24AA', '#6A1B9A'],
          badge: 'Customize',
        },
      ]
    : [];

  return (
    <View style={styles.mainContainer}>
      {/* Only status bar green; rest is normal */}
      <StatusBar
        backgroundColor="#4CAF50"
        barStyle="light-content"
        translucent={true}
      />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>
      <ImageBackground
        source={require('../images/innerimage.png')}
        style={styles.background}
        resizeMode="cover"
        opacity={0.1}>
        <View style={styles.scrollContainer}>
          {/* Farmer with Bulls - Full Width Hero Image */}
          <View style={styles.animationContainer}>
            <FarmerAnimation />
          </View>

          {/* Branded Title Section - Text Background Only */}
          <View style={styles.titleContainer}>
            <View style={styles.titleTextBackground}>
              <Text style={styles.title}>Choose Your {category}</Text>
              <Text style={styles.subtitle}>
                Select a delivery plan that works for you
              </Text>
            </View>
            <Text style={styles.tapGuidance}>👆 Tap on a pack to select</Text>
          </View>

          {/* Pack Cards - 2x2 Grid */}
          <View style={styles.packsContainer}>
            <View style={styles.categoriesGrid}>
              {packTypes.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📦</Text>

                    <Text style={styles.emptyTitle}>Packs Coming Soon</Text>

                    <Text style={styles.emptySubtitle}>
                      We're preparing fresh packs for this category. Please
                      check back shortly!
                    </Text>

                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => navigation.goBack()}>
                      <Text style={styles.emptyButtonText}>
                        Explore Other Packs
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                packTypes.map((pack, i) => {
                  const anim =
                    cardAnimations.current[i] || new Animated.Value(1);

                  return (
                    <View key={i} style={styles.cardWithBadgeContainer}>
                      <Animated.View
                        style={[
                          styles.categoryCard,
                          {
                            opacity: pack.available ? anim : 0.5,
                            transform: pack.available
                              ? [
                                  {
                                    scale: anim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0.8, 1],
                                    }),
                                  },
                                  {
                                    translateY: anim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [30, 0],
                                    }),
                                  },
                                ]
                              : [],
                          },
                        ]}>
                        <TouchableOpacity
                          style={styles.cardTouchable}
                          disabled={!pack.available}
                          onPress={() => {
                            if (pack.duration === 'custom') {
                              navigation.navigate('CustomPack', {category});
                            } else {
                              // Let PackContentsScreen fetch the pack and calculate price fresh
                              navigation.navigate('PackContents', {
                                category: category,
                                packType: pack.name,
                                duration: pack.duration,
                                packId: pack.apiPackId,
                              });
                            }
                          }}>
                          <LinearGradient
                            colors={pack.gradientColors}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.gradientBackground}>
                            <Text style={styles.categoryTitle}>
                              {pack.name}
                            </Text>
                            <Text style={styles.categoryText}>
                              {pack.description}
                            </Text>
                            <View style={styles.priceContainer}>
                              <Text style={styles.priceText}>{pack.price}</Text>
                            </View>
                            {!pack.available && (
                              <Text style={styles.unavailableText}>
                                Coming Soon
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                      {/* Badge outside card in white space */}
                      {pack.badge && (
                        <View style={styles.outsideBadgeContainer}>
                          <Text style={styles.outsideBadgeText}>
                            {pack.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* Slogan Caption */}
          <View style={styles.sloganContainer}>
            <Text style={styles.sloganText}>
              Freshness Delivered to Your Doorstep!
            </Text>
          </View>
          

          {/* Branded Title Section - Text Background Only */}
        </View>
      </ImageBackground>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {flex: 1, backgroundColor: '#f5f5f5'},
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  background: {flex: 1},
  scrollContainer: {flex: 1, paddingBottom: 100},

  // Slogan Container
  sloganContainer: {
    alignItems: 'center',
    paddingTop: 5,
  },
  sloganText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#43A047',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },

  centeredContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },

  // Animation Container - Full Width
  animationContainer: {
    marginVertical: 0,
    height: 50, // Further reduced height for more space
  },

  // Branded Title Section - No Background
  titleContainer: {
    paddingTop: 5,
    paddingBottom: 10,
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
    fontSize: 20,
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
    height: 150, // Increased height for bigger content
    marginVertical: 4,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
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
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  categoryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  priceContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  unavailableText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },

  emptyCard: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 25,
  },

  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PackTypesScreen;
