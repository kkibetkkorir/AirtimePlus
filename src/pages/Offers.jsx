import { useState, useEffect } from 'react';

const Offers = () => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState({});

  // Generate random email using only a-z and 0-9
  const generateRandomEmail = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
    
    // Generate username (8-12 chars)
    let username = '';
    const usernameLength = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < usernameLength; i++) {
      if (i < 6) {
        // First 6 characters are letters
        username += letters.charAt(Math.floor(Math.random() * letters.length));
      } else {
        // Remaining characters: 60% letters, 40% numbers
        if (Math.random() < 0.6) {
          username += letters.charAt(Math.floor(Math.random() * letters.length));
        } else {
          username += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
      }
    }
    
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${username}@${domain}`;
  };

  // Initialize email on component mount
  useEffect(() => {
    setCurrentEmail(generateRandomEmail());
  }, []);

  const offers = [
    {
      id: 0,
      name: 'Starter Pack',
      price: 25,
      features: [
        '30KSH airtime',
        'Valid for 30 days',
        'All networks',
        'Instant delivery'
      ]
    },
    {
      id: 1,
      name: 'Starter Pack',
      price: 50,
      features: [
        '10% bonus airtime',
        'Valid for 30 days',
        'All networks',
        'Instant delivery'
      ]
    },
    {
      id: 2,
      name: 'Value Pack',
      price: 100,
      features: [
        '15% bonus airtime',
        'Valid for 60 days',
        'All networks',
        'Instant delivery',
        '1GB data bonus'
      ]
    },
    {
      id: 3,
      name: 'Premium Pack',
      price: 250,
      features: [
        '20% bonus airtime',
        'Valid for 90 days',
        'All networks',
        'Instant delivery',
        '3GB data bonus',
        '10 free SMS'
      ]
    }
  ];

  const networkOffers = [
    {
      id: 4,
      name: 'Safaricom OFA',
      price: 100,
      network: 'Safaricom',
      description: 'Get 25% extra airtime on all Safaricom top-ups this week',
      color: '#1c9e41ff'
    },
    {
      id: 5,
      name: 'AT&T Special',
      price: 80,
      network: 'AT&T',
      description: 'Get 15% extra airtime on all AT&T top-ups this week',
      color: '#e74c3c'
    },
    {
      id: 6,
      name: 'Verizon Deal',
      price: 50,
      network: 'Verizon',
      description: 'Double data bonus with every Verizon airtime purchase',
      color: '#3498db'
    },
    {
      id: 7,
      name: 'T-Mobile Offer',
      price: 100,
      network: 'T-Mobile',
      description: 'Free international calls bonus with T-Mobile top-ups',
      color: '#9b59b6'
    }
  ];

  const showSuccessMessage = (offer, phone, reference) => {
    setSuccessData({
      offerName: offer.name,
      price: offer.price,
      phone: phone,
      reference: reference,
      email: currentEmail,
      timestamp: new Date().toLocaleTimeString()
    });
    setShowSuccessDialog(true);
    
    // Generate new email for next purchase
    setCurrentEmail(generateRandomEmail());
    
    // Close purchase modal
    setSelectedOffer(null);
    setPhoneNumber('');
    setLoading(false);
  };

  const handlePaystackPayment = async () => {
    setLoading(true);
    setMessage('Initializing payment...');

    try {
      // Format phone number
      let formattedPhone = phoneNumber.trim();
      
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+254' + formattedPhone;
      }

      // Call Railway API
      const response = await fetch('https://payment-api-production-1e82.up.railway.app/api/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: generateRandomEmail(),//currentEmail,
          amount: selectedOffer.price,
          phone: formattedPhone
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.status === 'success') {
          // Immediate success
          showSuccessMessage(selectedOffer, phoneNumber, data.reference);
          setMessage('');
        } else if (data.requires_authorization) {
          setMessage('✅ Payment initiated! Please check your phone to complete the M-Pesa authorization.');
          startPaymentPolling(data.reference);
        } else if (data.requires_otp) {
          setMessage('📱 OTP sent! Please check your phone for the authorization code.');
          const otp = prompt('Enter the OTP sent to your phone:');
          if (otp) {
            await submitOTP(data.reference, otp);
          }
        } else {
          setMessage(`📱 ${data.message || 'Payment processing...'}`);
        }
      } else {
        setMessage(`❌ ${data.message || 'Payment initialization failed'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      setMessage('❌ Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const startPaymentPolling = async (reference) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setMessage('⏰ Payment monitoring timeout. Please check your transaction history.');
        setLoading(false);
        return;
      }
      
      attempts++;
      
      try {
        const response = await fetch(`https://payment-api-production-1e82.up.railway.app/api/status/${reference}`);
        const data = await response.json();
        
        if (data.success) {
          if (data.paid) {
            // Payment successful via polling
            showSuccessMessage(selectedOffer, phoneNumber, reference);
            setMessage('');
            return;
          }
          
          if (data.can_retry) {
            setMessage('⚠️ Payment not completed. You can try again.');
            setLoading(false);
            return;
          }
          
          // Continue polling
          setTimeout(checkStatus, 6000);
        }
      } catch (error) {
        console.error('Status check error:', error);
        setTimeout(checkStatus, 6000);
      }
    };
    
    setTimeout(checkStatus, 6000);
  };

  const submitOTP = async (reference, otp) => {
    try {
      setMessage('Verifying OTP...');
      
      const response = await fetch('https://payment-api-production-1e82.up.railway.app/api/submit-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otp.trim(),
          reference: reference
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ OTP verified! Completing payment...');
        startPaymentPolling(reference);
      } else {
        setMessage(`❌ ${data.message || 'Invalid OTP. Please try again.'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('OTP Error:', error);
      setMessage('❌ OTP verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!selectedOffer || !phoneNumber) {
      setMessage('❌ Please select an offer and provide your phone number');
      return;
    }

    // Validate phone number
    const phoneRegex = /^(?:0|254|\+254)?[17]\d{8}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[-()]/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      setMessage('❌ Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)');
      return;
    }

    handlePaystackPayment();
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="page-header">
          <h1>Special Airtime Offers</h1>
          <p>Get the best value with our exclusive airtime deals and promotions</p>
          {/*currentEmail && (
            <small style={{color: '#6c757d', fontSize: '0.9rem', display: 'block', marginTop: '10px'}}>
              Using email: <strong>{currentEmail}</strong> (auto-generated)
            </small>
          )*/}
        </div>

        {message && (
          <div className={`message ${message.includes('❌') || message.includes('failed') ? 'error' : 
                         message.includes('✅') || message.includes('success') || message.includes('🎉') ? 'info' : 'info'}`}>
            {message}
          </div>
        )}

        <div className="offers-grid">
          {offers.map(offer => (
            <div key={offer.id} className="offer-card">
              <div className="offer-header">
                <h3>{offer.name}</h3>
              </div>
              <div className="offer-body">
                <div className="offer-price">KES {offer.price}</div>
                <ul className="offer-features">
                  {offer.features.map((feature, index) => (
                    <li key={index}>
                      <i className="fas fa-check"></i> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setSelectedOffer(offer)}
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="page-header">
          <h2>Network Specific Offers</h2>
          <p>Special deals tailored for your mobile network</p>
        </div>

        <div className="offers-grid">
          {networkOffers.map(offer => (
            <div key={offer.id} className="offer-card">
              <div className="offer-header" style={{ background: offer.color }}>
                <h3>{offer.name}</h3>
              </div>
              <div className="offer-body">
                <div className="offer-price">KES {offer.price}</div>
                <p>{offer.description}</p>
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={() => setSelectedOffer(offer)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedOffer && (
          <div className="purchase-modal">
            <div className="modal-content">
              <h2>Purchase {selectedOffer.name}</h2>
              <p>Price: KES {selectedOffer.price}</p>
              
              {/*<div style={{background: '#f8f9fa', padding: '10px', borderRadius: '5px', margin: '15px 0'}}>
                <small><strong>Email:</strong> {currentEmail} (auto-generated)</small>
              </div>*/}

              {selectedOffer.description && <p>{selectedOffer.description}</p>}

              <div className="form-group">
                <label htmlFor="phone">Your Phone Number To Top-Up</label>
                <input
                  type="tel"
                  id="phone"
                  className="form-control"
                  placeholder="Enter your phone number (e.g., 0712345678)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading}
                />
                <small style={{color: '#6c757d', fontSize: '0.9rem', display: 'block', marginTop: '5px'}}>
                  Kenyan numbers only. {/*<code style={{
                    fontWeight: "bold"
                  }}>Use phone to be credited.</code>.*/}
                </small>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSelectedOffer(null);
                    setPhoneNumber('');
                    setMessage('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePurchase}
                  disabled={loading || !phoneNumber}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '8px'
                      }}></span>
                      Processing...
                    </>
                  ) : (
                    'Confirm Purchase'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Dialog */}
        {showSuccessDialog && (
          <div className="success-dialog">
            <div className="success-content">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Payment Successful! 🎉</h2>
              <p>Your purchase has been completed successfully.</p>
              
              <div className="success-details">
                <div className="detail-row">
                  <span className="detail-label">Offer:</span>
                  <span className="detail-value">{successData.offerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">KES {successData.price}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone Number:</span>
                  <span className="detail-value">{successData.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Transaction ID:</span>
                  <span className="detail-value" style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                    {successData.reference || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{successData.timestamp}</span>
                </div>
              </div>
              
              <div className="success-message">
                <p><strong>🎁 What happens next?</strong></p>
                <ul>
                  <li>Your airtime will be delivered within 2-5 minutes</li>
                  {/*<li>Check your phone for confirmation SMS</li>*/}
                  <li>You'll receive {successData.offerName} benefits immediately</li>
                  {/*<li>Transaction receipt has been sent to {successData.email}</li>*/}
                </ul>
              </div>
              
              <div className="success-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowSuccessDialog(false)}
                  style={{width: '100%'}}
                >
                  Continue Shopping
                </button>
                {/*<button
                  className="btn btn-outline"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    // Optional: Print receipt or save details
                  }}
                  style={{width: '100%', marginTop: '10px'}}
                >
                  Print Receipt
                </button>*/}
              </div>
              
              <div className="success-note">
                <small>
                  <i className="fas fa-info-circle"></i> Need help? Contact support if you don't receive your airtime within 10 minutes.
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Success Dialog Styles */
        .success-dialog {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }
        
        .success-content {
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s ease;
          text-align: center;
        }
        
        .success-icon {
          font-size: 4rem;
          color: #10b981;
          margin-bottom: 20px;
          animation: scaleIn 0.5s ease;
        }
        
        .success-content h2 {
          color: #10b981;
          margin-bottom: 10px;
          font-size: 1.8rem;
        }
        
        .success-content p {
          color: #6b7280;
          margin-bottom: 25px;
        }
        
        .success-details {
          background: #f9fafb;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .detail-label {
          font-weight: 600;
          color: #374151;
        }
        
        .detail-value {
          color: #111827;
          font-weight: 500;
        }
        
        .success-message {
          background: #d1fae5;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
          border-left: 4px solid #10b981;
        }
        
        .success-message p {
          color: #065f46;
          margin-bottom: 10px;
        }
        
        .success-message ul {
          padding-left: 20px;
          margin: 0;
          color: #065f46;
        }
        
        .success-message li {
          margin-bottom: 8px;
        }
        
        .success-actions {
          margin-top: 25px;
        }
        
        .success-note {
          margin-top: 20px;
          padding: 12px;
          background: #f0f9ff;
          border-radius: 8px;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
        
        .success-note i {
          margin-right: 8px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @media (max-width: 768px) {
          .success-content {
            padding: 20px;
            width: 95%;
          }
          
          .success-icon {
            font-size: 3rem;
          }
          
          .success-content h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Offers;