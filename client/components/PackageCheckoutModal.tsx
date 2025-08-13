import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Shield, 
  CheckCircle, 
  RefreshCw,
  Crown,
  Star,
  Zap,
  Package,
  AlertCircle,
  DollarSign
} from 'lucide-react';

interface PackageCheckoutModalProps {
  package: {
    _id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    duration: number;
    type: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (packageId: string, paymentMethod: string, paymentDetails?: any) => Promise<any>;
  isProcessing?: boolean;
}

const PaymentMethod = {
  ONLINE: 'online',
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
  WALLET: 'wallet'
};

const PackageCheckoutModal: React.FC<PackageCheckoutModalProps> = ({
  package: pkg,
  isOpen,
  onClose,
  onPurchase,
  isProcessing = false
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PaymentMethod.ONLINE);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    upiId: '',
    bankName: '',
    customerName: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  const getPackageIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'featured':
        return <Star className="h-5 w-5 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'basic':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPackageColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium':
        return 'border-yellow-200 bg-yellow-50';
      case 'featured':
        return 'border-blue-200 bg-blue-50';
      case 'spotlight':
        return 'border-purple-200 bg-purple-50';
      case 'basic':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!paymentDetails.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!paymentDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(paymentDetails.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!paymentDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(paymentDetails.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    // Payment method specific validations
    switch (selectedPaymentMethod) {
      case PaymentMethod.CARD:
        if (!paymentDetails.cardNumber.trim()) {
          newErrors.cardNumber = 'Card number is required';
        } else if (!/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
          newErrors.cardNumber = 'Invalid card number';
        }

        if (!paymentDetails.expiryDate.trim()) {
          newErrors.expiryDate = 'Expiry date is required';
        } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentDetails.expiryDate)) {
          newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
        }

        if (!paymentDetails.cvv.trim()) {
          newErrors.cvv = 'CVV is required';
        } else if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
          newErrors.cvv = 'Invalid CVV';
        }

        if (!paymentDetails.cardholderName.trim()) {
          newErrors.cardholderName = 'Cardholder name is required';
        }
        break;

      case PaymentMethod.UPI:
        if (!paymentDetails.upiId.trim()) {
          newErrors.upiId = 'UPI ID is required';
        } else if (!/^[\w.-]+@[\w.-]+$/.test(paymentDetails.upiId)) {
          newErrors.upiId = 'Invalid UPI ID format';
        }
        break;

      case PaymentMethod.NETBANKING:
        if (!paymentDetails.bankName.trim()) {
          newErrors.bankName = 'Bank name is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePurchase = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      const result = await onPurchase(pkg._id, selectedPaymentMethod, paymentDetails);
      if (result.success) {
        onClose();
        // Reset form
        setPaymentDetails({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: '',
          upiId: '',
          bankName: '',
          customerName: '',
          email: '',
          phone: ''
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Package Summary */}
          <Card className={`mb-6 border-2 ${getPackageColor(pkg.type)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPackageIcon(pkg.type)}
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                </div>
                {pkg.type === 'premium' && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ₹{pkg.price}
                <span className="text-sm font-normal text-gray-500">
                  /{pkg.duration} days
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pkg.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={paymentDetails.customerName}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your full name"
                    className={errors.customerName ? 'border-red-500' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={paymentDetails.phone}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={paymentDetails.email}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod(PaymentMethod.ONLINE)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedPaymentMethod === PaymentMethod.ONLINE
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Online Payment</p>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod(PaymentMethod.UPI)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedPaymentMethod === PaymentMethod.UPI
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Smartphone className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">UPI</p>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod(PaymentMethod.CARD)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedPaymentMethod === PaymentMethod.CARD
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Credit/Debit Card</p>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod(PaymentMethod.NETBANKING)}
                  className={`p-4 border rounded-lg text-center transition-colors ${
                    selectedPaymentMethod === PaymentMethod.NETBANKING
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Net Banking</p>
                </button>
              </div>

              {/* Payment Method Forms */}
              {selectedPaymentMethod === PaymentMethod.CARD && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      value={formatCardNumber(paymentDetails.cardNumber)}
                      onChange={(e) => setPaymentDetails(prev => ({ 
                        ...prev, 
                        cardNumber: e.target.value.replace(/\s/g, '') 
                      }))}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={errors.cardNumber ? 'border-red-500' : ''}
                    />
                    {errors.cardNumber && (
                      <p className="text-xs text-red-600 mt-1">{errors.cardNumber}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={errors.expiryDate ? 'border-red-500' : ''}
                      />
                      {errors.expiryDate && (
                        <p className="text-xs text-red-600 mt-1">{errors.expiryDate}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                        placeholder="123"
                        maxLength={4}
                        className={errors.cvv ? 'border-red-500' : ''}
                      />
                      {errors.cvv && (
                        <p className="text-xs text-red-600 mt-1">{errors.cvv}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cardholderName">Cardholder Name *</Label>
                    <Input
                      id="cardholderName"
                      value={paymentDetails.cardholderName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                      placeholder="Name as on card"
                      className={errors.cardholderName ? 'border-red-500' : ''}
                    />
                    {errors.cardholderName && (
                      <p className="text-xs text-red-600 mt-1">{errors.cardholderName}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedPaymentMethod === PaymentMethod.UPI && (
                <div>
                  <Label htmlFor="upiId">UPI ID *</Label>
                  <Input
                    id="upiId"
                    value={paymentDetails.upiId}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="yourname@paytm"
                    className={errors.upiId ? 'border-red-500' : ''}
                  />
                  {errors.upiId && (
                    <p className="text-xs text-red-600 mt-1">{errors.upiId}</p>
                  )}
                </div>
              )}

              {selectedPaymentMethod === PaymentMethod.NETBANKING && (
                <div>
                  <Label htmlFor="bankName">Select Bank *</Label>
                  <select
                    id="bankName"
                    value={paymentDetails.bankName}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    className={`w-full p-2 border rounded-md ${errors.bankName ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select your bank</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="pnb">Punjab National Bank</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.bankName && (
                    <p className="text-xs text-red-600 mt-1">{errors.bankName}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your payment information is secure and encrypted. We use industry-standard security measures to protect your data.
            </AlertDescription>
          </Alert>

          {/* Total and Purchase Button */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">₹{pkg.price}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Valid for</p>
                <p className="font-medium">{pkg.duration} days</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={processing || isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                disabled={processing || isProcessing}
              >
                {processing || isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay ₹{pkg.price}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCheckoutModal;
