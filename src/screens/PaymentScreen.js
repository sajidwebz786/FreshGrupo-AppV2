import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';

import Ionicons from 'react-native-vector-icons/Ionicons';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {cartItems = [], deliveryAddress, totalAmount = 0, gstAmount = 0} = route.params || {};

  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const [timeSlot, setTimeSlot] = useState('');

  const [selectedDate, setSelectedDate] = useState(null);

  const dates = Array.from(
    {length: 10},
    (_, i) => new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
  );

  // Fetch wallet balance
  const fetchWallet = async () => {
    try {
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
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoadingWallet(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, []),
  );

  // Calculate final amount based on wallet usage
  const walletDiscount = useWallet ? Math.min(walletBalance, totalAmount) : 0;
  const finalAmount = totalAmount - walletDiscount;

  const validateDelivery = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select delivery date');
      return false;
    }

    if (!timeSlot || timeSlot.trim() === '') {
      Alert.alert('Error', 'Please select delivery time slot');
      return false;
    }

    return true;
  };
  /* =========================
      WALLET PAYMENT
   ========================= */
  const handleWalletPayment = async () => {
    if (!validateDelivery()) return;

    try {
      setProcessing(true);

      const userData = await AsyncStorage.getItem('userData');
      const currentUser = JSON.parse(userData);
      const token = await AsyncStorage.getItem('userToken');

      const res = await fetch(
        'https://freshgrupo-server.onrender.com/api/orders/wallet/checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.id,
            deliveryAddress,
            timeSlot,
            deliveryDate: selectedDate.toISOString(),
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      Alert.alert('Success', 'Order placed successfully');

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Drawer',
              state: {
                routes: [{name: 'OrderHistory'}],
              },
            },
          ],
        }),
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
      RAZORPAY PAYMENT
   ========================= */
  const handleRazorpayPayment = async () => {
    if (!validateDelivery()) return;

    try {
      setProcessing(true);

      const userData = await AsyncStorage.getItem('userData');
      const currentUser = JSON.parse(userData);
      const token = await AsyncStorage.getItem('userToken');

      // ✅ STEP 1: INITIATE PAYMENT
      const initRes = await fetch(
        'https://freshgrupo-server.onrender.com/api/orders/razorpay/create-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.id,
            useWallet,
          }),
        },
      );

      const initData = await initRes.json();

      if (!initRes.ok) throw new Error(initData.error);

      const options = {
        description: 'Fresh Grupo Order',
        currency: 'INR',
        key: initData.key,
        amount: initData.amount,
        name: 'Fresh Grupo',
        prefill: {
          email: currentUser.email,
          contact: currentUser.phone,
          name: currentUser.name,
        },
        theme: {color: '#4CAF50'},
      };

      // ✅ STEP 2: OPEN RAZORPAY
      const paymentData = await RazorpayCheckout.open(options);

      // ✅ STEP 3: VERIFY + CREATE ORDER
      const verifyRes = await fetch(
        'https://freshgrupo-server.onrender.com/api/orders/razorpay/verify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.id,
            razorpayPaymentId: paymentData.razorpay_payment_id,
            razorpayOrderId: paymentData.razorpay_order_id,
            walletUsed: initData.walletUsed,
            deliveryAddress,
            timeSlot,
            deliveryDate: selectedDate.toISOString(),
          }),
        },
      );

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) throw new Error(verifyData.error);

      Alert.alert('Success', 'Order placed successfully');

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Drawer',
              state: {
                routes: [{name: 'OrderHistory'}],
              },
            },
          ],
        }),
      );
    } catch (err) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
     CASH ON DELIVERY
  ========================= */

  const handleCOD = async () => {
    if (!validateDelivery()) return;

    try {
      setProcessing(true);

      const userData = await AsyncStorage.getItem('userData');
      const currentUser = JSON.parse(userData);
      const token = await AsyncStorage.getItem('userToken');

      const res = await fetch(
        'https://freshgrupo-server.onrender.com/api/orders/cod/checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.id,
            deliveryAddress,
            timeSlot,
            deliveryDate: selectedDate.toISOString(),
            useWallet, // ✅ IMPORTANT
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      Alert.alert(
        'Order Placed',
        `Wallet Used: ₹${data.walletUsed}\nCOD Amount: ₹${data.codAmount}`,
      );

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Drawer',
              state: {
                routes: [{name: 'OrderHistory'}],
              },
            },
          ],
        }),
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
      ADD TO WALLET (via Razorpay)
   ========================= */
  const handleAddToWallet = async () => {
    // Show a simple alert with TextInput workaround - just navigate to BuyCredits
    navigation.navigate('BuyCredits');
  };

  /* =========================
      UI
   ========================= */
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

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Complete Your Payment</Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Amount (incl. GST)</Text>
          <Text style={styles.amount}>₹{totalAmount}</Text>
        </View>
        <View style={[styles.amountBox, {backgroundColor: '#f8f9fa', marginTop: -10, marginBottom: 10}]}> 
          <Text style={[styles.amountLabel, {color: '#555'}]}>GST (18%)</Text>
          <Text style={[styles.amount, {color: '#555', fontSize: 16}]}>₹{gstAmount ? gstAmount.toFixed(2) : (totalAmount * 0.18 / 1.18).toFixed(2)}</Text>
        </View>

        {/* Wallet Section - Always show */}
        {!loadingWallet && (
          <View style={styles.walletBox}>
            <View style={styles.walletHeader}>
              <View style={styles.walletInfo}>
                <Ionicons name="wallet" size={24} color="#4CAF50" />
                <View style={styles.walletTextContainer}>
                  <Text style={styles.walletTitle}>Wallet Balance</Text>
                  <Text style={styles.walletBalance}>
                    ₹{walletBalance.toFixed(2)}
                  </Text>
                </View>
              </View>
              {walletBalance > 0 && (
                <TouchableOpacity
                  style={[
                    styles.useWalletButton,
                    useWallet && styles.useWalletButtonActive,
                  ]}
                  onPress={() => setUseWallet(!useWallet)}>
                  <Text
                    style={[
                      styles.useWalletButtonText,
                      useWallet && styles.useWalletButtonTextActive,
                    ]}>
                    {useWallet ? '✓ Using Wallet' : 'Use Wallet'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {walletBalance > 0 && useWallet && (
              <View style={styles.walletDiscount}>
                <Text style={styles.walletDiscountText}>
                  Wallet Discount: -₹{walletDiscount.toFixed(2)}
                </Text>
                <Text style={styles.finalAmountText}>
                  Final Amount to Pay: ₹{finalAmount.toFixed(2)}
                </Text>
              </View>
            )}
            {/* Add to Wallet Button */}
            <TouchableOpacity
              style={styles.addWalletButton}
              onPress={handleAddToWallet}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addWalletText}>Add Money to Wallet</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dateContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.dateTitle}>Select Delivery Date</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroll}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateButton,
                  selectedDate &&
                    selectedDate.toDateString() === date.toDateString() &&
                    styles.selectedDate,
                ]}
                onPress={() => setSelectedDate(date)}
                disabled={processing}>
                <Text
                  style={[
                    styles.dateText,
                    selectedDate &&
                      selectedDate.toDateString() === date.toDateString() &&
                      styles.selectedDateText,
                  ]}>
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.slotContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="time-outline" size={20} color="#4CAF50" />
            <Text style={styles.slotTitle}>Select Delivery Time Slot</Text>
          </View>
          <View style={styles.slotButtons}>
            {['9 AM - 11 AM', '11 AM - 1 PM', '1 PM - 3 PM', '3 PM - 5 PM'].map(
              slot => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotButton,
                    timeSlot === slot && styles.selected,
                  ]}
                  onPress={() => setTimeSlot(slot)}
                  disabled={processing}>
                  <Text
                    style={[
                      styles.slotText,
                      timeSlot === slot && styles.selectedText,
                    ]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </View>

        {/* <TouchableOpacity
          style={[styles.payButton, processing && styles.disabled]}
          onPress={handleRazorpayPayment}
          disabled={processing}
        >
          <Text style={styles.payText}>
            {processing ? 'Processing...' : `Pay Online ₹${useWallet ? finalAmount : totalAmount}`}
          </Text>
        </TouchableOpacity> */}
        {/* 
        {walletBalance > 0 && (
          <TouchableOpacity
            style={[styles.walletPayButton, processing && styles.disabled]}
            onPress={handleWalletPayment}
            disabled={processing}
          >
            <Ionicons name="wallet" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.walletPayText}>
              {processing ? 'Processing...' : `Pay with Wallet ₹${useWallet ? finalAmount : totalAmount}`}
            </Text>
          </TouchableOpacity>
        )} */}

        {/* <TouchableOpacity
          style={[styles.codButton, processing && styles.disabled]}
          onPress={handleCOD}
          disabled={processing}
        >
          <Text style={styles.codText}>Cash on Delivery</Text>
        </TouchableOpacity> */}

        {finalAmount === 0 ? (
          // ✅ FULL WALLET PAYMENT
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleWalletPayment}
            disabled={processing}>
            <Text style={styles.payText}>
              {processing ? 'Processing...' : 'Place Order (Wallet)'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* ✅ ONLINE PAYMENT */}
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleRazorpayPayment}
              disabled={processing}>
              <Text style={styles.payText}>
                {processing ? 'Processing...' : `Pay Online ₹${finalAmount}`}
              </Text>
            </TouchableOpacity>

            {/* ✅ COD */}
            <TouchableOpacity
              style={styles.codButton}
              onPress={handleCOD}
              disabled={processing}>
              <Text style={styles.codText}>
                Cash on Delivery ₹{finalAmount}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f8f9fa'},
  headerContainer: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
  },
  scroll: {padding: 20, paddingBottom: 120},
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  amountLabel: {fontSize: 16, color: '#666'},
  amount: {fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginTop: 5},

  // Wallet styles
  walletBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {flexDirection: 'row', alignItems: 'center'},
  walletTextContainer: {marginLeft: 12},
  walletTitle: {fontSize: 14, color: '#666'},
  walletBalance: {fontSize: 18, fontWeight: 'bold', color: '#4CAF50'},
  useWalletButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  useWalletButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  useWalletButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  useWalletButtonTextActive: {
    color: '#fff',
  },
  walletDiscount: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  walletDiscountText: {fontSize: 14, color: '#4CAF50', fontWeight: 'bold'},
  finalAmountText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 4,
  },
  addWalletButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addWalletText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  payButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  walletPayButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletPayText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  payText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  codButton: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  codText: {
    color: '#4CAF50',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabled: {opacity: 0.6},
  slotContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  slotTitle: {fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8},
  slotButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  selected: {backgroundColor: '#4CAF50'},
  slotText: {color: '#4CAF50', fontWeight: 'bold'},
  selectedText: {color: '#fff'},
  dateContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  dateTitle: {fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8},
  dateScroll: {marginBottom: 10},
  dateButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 80,
  },
  selectedDate: {backgroundColor: '#4CAF50'},
  dateText: {color: '#4CAF50', fontWeight: 'bold', fontSize: 12},
  selectedDateText: {color: '#fff'},
});

export default PaymentScreen;
