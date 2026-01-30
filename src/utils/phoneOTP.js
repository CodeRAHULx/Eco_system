// Validate Indian phone number (10 digits)
const validateIndianPhone = (phoneNumber) => {
  const indianPhoneRegex = /^[6-9]\d{9}$/;
  return indianPhoneRegex.test(phoneNumber.replace(/\D/g, ""));
};

// Generate OTP (6 digits)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify OTP
const verifyOTP = (storedOTP, providedOTP) => {
  return storedOTP === providedOTP;
};

module.exports = {
  validateIndianPhone,
  generateOTP,
  verifyOTP,
};
