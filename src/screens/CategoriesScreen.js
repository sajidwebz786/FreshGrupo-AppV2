import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollInterval = useRef(null);

  const handleSelectCategory = category => {
    console.log('Category object:', category);
    console.log('Category name:', category.name);

    const categoryName = category.name || category;

    navigation.navigate('PackTypes', {category: categoryName});
  };

  useEffect(() => {
    fetchCategories();
    startAutoScroll();

    return () => clearInterval(autoScrollInterval.current);
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const response = await api.getCategories();

      console.log('Categories API Response:', response);

      const categoriesArray = Array.isArray(response) ? response : [];

      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const startAutoScroll = () => {
    autoScrollInterval.current = setInterval(() => {
      setActiveSlide(prevSlide => {
        const nextSlide = (prevSlide + 1) % offers.length;

        scrollViewRef.current?.scrollTo({
          x: nextSlide * Dimensions.get('window').width,
          animated: true,
        });

        return nextSlide;
      });
    }, 3000);
  };

  const handleScrollBegin = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  };

  const handleScrollEnd = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }

    autoScrollInterval.current = setInterval(() => {
      setActiveSlide(prevSlide => {
        const nextSlide = (prevSlide + 1) % offers.length;

        scrollViewRef.current?.scrollTo({
          x: nextSlide * Dimensions.get('window').width,
          animated: true,
        });

        return nextSlide;
      });
    }, 3000);
  };

  const offers = [
    {
      id: 1,
      category: 'Vegetables',
      image: require('../images/vegetables_pack.jpg'),
      discount: '20% OFF on',
      title: 'Fresh Vegetables - Launch Offer',
    },
    {
      id: 2,
      category: 'Fruits',
      image: require('../images/fruits_pack.jpg'),
      discount: '20% OFF on',
      title: 'Juicy Fruits - Launch Offer',
    },
    {
      id: 3,
      category: 'Groceries',
      image: require('../images/grocery_pack.jpg'),
      discount: '20% OFF on',
      title: 'Essential Groceries - Launch Offer',
    },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
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
          <View style={styles.offersContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={styles.offersScroll}
              decelerationRate="fast"
              snapToInterval={Dimensions.get('window').width}
              onScroll={event => {
                const slideIndex = Math.round(
                  event.nativeEvent.contentOffset.x /
                    Dimensions.get('window').width,
                );
                setActiveSlide(slideIndex);
              }}
              scrollEventThrottle={16}
              onTouchStart={handleScrollBegin}
              onMomentumScrollEnd={handleScrollEnd}>
              {offers.map((offer, index) => (
                <View key={offer.id} style={styles.offerCard}>
                  <ImageBackground
                    source={offer.image}
                    style={styles.offerBackground}
                    resizeMode="cover">
                    <View style={styles.discountOverlay}>
                      <Text style={styles.discountText}>{offer.discount}</Text>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                    </View>

                    <View style={styles.categoryIconContainer}>
                      <Image source={offer.image} style={styles.categoryIcon} />
                    </View>
                  </ImageBackground>
                </View>
              ))}
            </ScrollView>

            <View style={styles.paginationDots}>
              {offers.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeSlide === index
                      ? styles.activeDot
                      : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.title}>Choose Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.length === 0 ? (
              <View
                style={{width: '100%', alignItems: 'center', marginTop: 20}}>
                <Text style={{fontSize: 16, color: '#666', fontWeight: '600'}}>
                  Categories will come soon
                </Text>
              </View>
            ) : (
              categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryCard}
                  onPress={() => handleSelectCategory(category)}>
                  <Image
                    source={{uri: String(category.image)}}
                    style={styles.categoryImage}
                  />

                  <Text style={styles.categoryTitle}>{category.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

        </View>
      </ImageBackground>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  background: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  offersContainer: {
    height: 120,
    marginVertical: 2,
  },
  offersScroll: {
    flex: 1,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  inactiveDot: {
    backgroundColor: '#ddd',
  },
  offerCard: {
    width: Dimensions.get('window').width,
    height: 120,
  },
  offerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  offerTitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  categoryIconContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{translateY: -40}],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    padding: 10,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: 5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  categoryCard: {
    width: '30%',
    marginVertical: 5,
    marginHorizontal: 3,
    alignItems: 'center',
    paddingVertical: 5,
  },
  categoryImage: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});

export default CategoriesScreen;
