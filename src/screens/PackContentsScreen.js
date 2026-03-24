import React, {useState, useEffect} from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const {width} = Dimensions.get('window');

const PackContentsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {category, packType, packId, duration} = route.params || {};

  const [packDetails, setPackDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchPackDetails();
    fetchWalletBalance();
  }, [packId, duration, category]);

  const fetchWalletBalance = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (currentUser?.id) {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(
          'https://freshgrupo-server.onrender.com/api/wallet',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        if (data.wallet) {
          setWalletBalance(parseFloat(data.wallet.balance) || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  const fetchPackDetails = async () => {
    try {
      setLoading(true);
      let packData = null;

      if (packId) {
        // If we have packId, fetch directly
        packData = await api.getPackDetails(packId);
      } else if (category && duration) {
        // Otherwise, fetch by category and duration
        const categories = await api.getCategories();
        const selectedCategory = categories.find(cat => cat.name === category);
        if (selectedCategory) {
          const packs = await api.getPacksByCategory(selectedCategory.id);
          // Find pack with matching duration
          const matchedPack = packs.find(
            p => p.PackType?.duration === duration,
          );
          if (matchedPack) {
            packData = await api.getPackDetails(matchedPack.id);
          }
        }
      }

      setPackDetails(packData);

      if (packData?.Products?.length) {
        // Sort products alphabetically by name
        const sortedProducts = [...packData.Products].sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
        packData.Products = sortedProducts;
        
        const total = sortedProducts.reduce((sum, item) => {
          const price = item.PackProduct?.unitPrice || item.price || 0;
          const qty = parseFloat(item.PackProduct?.quantity) || 1;
          return sum + price * qty;
        }, 0);
        setGrandTotal(total);
      }
    } catch (error) {
      console.error('Error fetching pack details:', error);
    } finally {
      setLoading(false);
    }
  };

    // Format quantity - remove extra decimals
  const formatQuantity = (qty, unitAbbreviation) => {
    // Handle invalid qty
    if (qty === undefined || qty === null) {
      return '1';
    }
    
    // Convert to number
    let numericQty = qty;
    if (typeof qty === 'string') {
      numericQty = parseFloat(qty);
    }
    
    // If not a valid number, return the original value or '1'
    if (isNaN(numericQty)) {
      return String(qty) || '1';
    }
    
    // Round to remove extra decimals
    const roundedQty = Math.round(numericQty);
    return String(roundedQty);
  };

  const getProductIcon = name => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('mango')) return '🥭';
    if (lowerName.includes('grape')) return '🍇';
    if (lowerName.includes('carrot')) return '🥕';
    if (lowerName.includes('apple')) return '🍎';
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('orange')) return '🍊';
    if (lowerName.includes('juice') || lowerName.includes('drink')) return '🥤';
    if (lowerName.includes('milk')) return '🥛';
    if (lowerName.includes('bread')) return '🍞';
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('wheat')) return '🌾';
    if (lowerName.includes('sugar')) return '🧂';
    if (lowerName.includes('salt')) return '🧂';
    if (lowerName.includes('oil')) return '🫒';
    if (lowerName.includes('tomato')) return '🍅';
    if (lowerName.includes('potato')) return '🥔';
    if (lowerName.includes('onion')) return '🧅';
    if (lowerName.includes('garlic')) return '🧄';
    if (lowerName.includes('ginger')) return '🫚';
    if (lowerName.includes('spinach')) return '🥬';
    if (lowerName.includes('lettuce')) return '🥬';
    if (lowerName.includes('cucumber')) return '🥒';
    if (lowerName.includes('pepper')) return '🫑';
    if (lowerName.includes('egg')) return '🥚';
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('fish')) return '🐟';
    if (lowerName.includes('cheese')) return '🧀';
    if (lowerName.includes('butter')) return '🧈';
    if (lowerName.includes('yogurt')) return '🥛';
    if (lowerName.includes('honey')) return '🍯';
    if (lowerName.includes('nuts') || lowerName.includes('almond')) return '🥜';
    if (lowerName.includes('dates')) return '🌴';
    if (lowerName.includes('raisin')) return '🍇';
    if (lowerName.includes('tea')) return '🍵';
    if (lowerName.includes('coffee')) return '☕';
    if (lowerName.includes('masala') || lowerName.includes('spice'))
      return '🌶️';
    if (lowerName.includes('dal') || lowerName.includes('lentil')) return '🫘';
    if (lowerName.includes('flour')) return '🌾';
    if (lowerName.includes('atta')) return '🌾';
    if (lowerName.includes('maida')) return '🌾';
    if (lowerName.includes('besan')) return '🌾';
    if (lowerName.includes('corn')) return '🌽';
    if (lowerName.includes('peas')) return '🫛';
    if (lowerName.includes('beans')) return '🫘';
    if (lowerName.includes('chickpea')) return '🫘';
    if (lowerName.includes('moong')) return '🫘';
    if (lowerName.includes('urad')) return '🫘';
    if (lowerName.includes('toor')) return '🫘';
    if (lowerName.includes('masoor')) return '🫘';
    if (lowerName.includes('rajma')) return '🫘';
    if (lowerName.includes('chana')) return '🫘';
    // Default icon
    return '🥦';
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        alert('Please login first');
        return;
      }
      const user = JSON.parse(userData);

      // Validate user.id exists and is valid
      if (!user || !user.id || isNaN(user.id)) {
        alert('Invalid user session. Please login again.');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      await api.addToCart(
        {
          userId: user.id,
          packId,
          quantity: 1,
          unitPrice: grandTotal,
        },
        token,
      );
      alert('Pack added to cart successfully!');
      // Navigate to Cart screen which will refresh the header
      navigation.navigate('Drawer', {
        screen: 'Cart',
      });
    } catch (err) {
      console.error(err);
      // Show the actual error message from the API
      const errorMessage =
        err.response?.error || err.message || 'Failed to add to cart';
      alert(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading pack contents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#4CAF50"
        barStyle="light-content"
        translucent={true}
      />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <View style={styles.packInfo}>
        <Text style={styles.packTitle}>
          {category} - {packType}
        </Text>
        <Text style={styles.packPrice}>₹{grandTotal}</Text>
        {/* Pack Details Info - Flattened to show full description */}
        {packDetails?.content && (
          <Text style={styles.packDetailText} numberOfLines={2}>
            {packDetails.content.replace(/\n/g, ' ')}
          </Text>
        )}
      </View>

      <View style={styles.productsSection}>
        <View style={styles.contentsHeader}>
          <Text style={styles.contentsTitle}>Pack Contents</Text>
          <Text style={styles.productCount}>
            {packDetails?.Products?.length || 0} items
          </Text>
          <Text style={styles.scrollHint}>↓ Scroll</Text>
        </View>

        {/* Table Header: Product, Qty, Price, Value */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colIcon]}></Text>
          <Text style={[styles.headerText, styles.colProduct]}>Product</Text>
          <Text style={[styles.headerText, {width: 55, textAlign: 'center'}]}>Unit</Text>
          <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
          <Text style={[styles.headerText, styles.colPrice]}>Price</Text>
          <Text style={[styles.headerText, styles.colValue]}>Total</Text>
        </View>

        {/* Pack Products */}
        <ScrollView
          style={styles.productsScroll}
          showsVerticalScrollIndicator={true}>
          {(packDetails?.Products || []).map((item, index) => {
            const unitPrice = item.PackProduct?.unitPrice || item.price || 0;
            let qty = item.PackProduct?.quantity;
            // Defensive: If quantity is undefined or null, default to 1
            if (qty === undefined || qty === null) {
              qty = 1;
            }
            // Convert qty to number for calculation
            const numericQty = parseFloat(qty);
            const totalValue = unitPrice * numericQty;
            // Format quantity nicely - show as fraction for common values
            const formatQtyDisplay = (q) => {
              const numQty = parseFloat(q);
              if (numQty === 0.5) return '1/2';
              if (numQty === 0.25) return '1/4';
              if (numQty === 0.75) return '3/4';
              if (numQty === 1.5) return '1.5';
              if (numQty === 2.5) return '2.5';
              if (Number.isInteger(numQty)) return numQty.toString();
              return numQty.toString();
            };
            const qtyDisplay = formatQtyDisplay(qty);
            return (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.colIcon, styles.iconContainer]}>
                  {item.image ? (
                    <Image
                      source={{uri: item.image}}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.productIcon}>
                      {getProductIcon(item.name)}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.productName, styles.colProduct]}
                  numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.unitText, {width: 55, textAlign: 'center'}]}>
                  {item.PackProduct?.UnitType?.abbreviation || item.UnitType?.abbreviation || ''}
                </Text>
                <Text style={[styles.qtyText, styles.colQty]}>
                  {qtyDisplay}
                </Text>
                <Text style={[styles.priceText, styles.colPrice]}>
                  ₹{Math.round(unitPrice)}
                </Text>
                <Text style={[styles.valueText, styles.colValue]}>
                  ₹{totalValue.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Credit Info at Bottom */}
      <View style={styles.bottomCreditInfo}>
        <Text style={styles.bottomCreditText}>
          💳 {grandTotal} Credits Required | Wallet: {walletBalance.toFixed(0)} Credits
          {walletBalance >= grandTotal ? ' ✓' : ' - Need ' + (grandTotal - walletBalance).toFixed(0) + ' more'}
        </Text>
      </View>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={addingToCart}>
          <Text style={styles.addToCartText}>
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  packInfo: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  packTitle: {fontSize: 20, fontWeight: 'bold'},
  packPrice: {fontSize: 22, fontWeight: 'bold', color: '#28a745'},
  packDetails: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  packDetailText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 4,
  },
  creditInfo: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    textAlign: 'center',
  },
  creditText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  walletText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  bottomCreditInfo: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bottomCreditText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },

  scrollContainer: {marginHorizontal: 10},
  scrollContent: {paddingBottom: 100},
  contentsTitle: {fontSize: 16, fontWeight: 'bold', marginVertical: 10},

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  colIcon: {width: 40, textAlign: 'center'},
  colProduct: {flex: 1.2, marginRight: 8},
  colQty: {width: 45, textAlign: 'center'},
  colPrice: {width: 60, textAlign: 'right'},
  colValue: {width: 65, textAlign: 'right'},

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginTop: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productIcon: {fontSize: 32, textAlign: 'center'},
  productName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  unitText: {fontSize: 11, color: '#666', textAlign: 'center', fontWeight: '500'},
  valueText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  qtyText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  totalText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'right',
    fontWeight: 'bold',
  },

  grandTotalContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 5,
  },
  grandTotalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },

  floatingButtonContainer: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    marginTop: 16,
  },
  addToCartButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  addToCartText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},

  loadingText: {marginTop: 10, color: '#666'},
  iconContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  productImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  productIcon: {
    fontSize: 32,
  },
  productsSection: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 150,
  },

  contentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  scrollHint: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },

  contentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  productCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  productsScroll: {
    flex: 1,
    marginTop: 6,
    paddingBottom: 120,
  },
});

export default PackContentsScreen;
