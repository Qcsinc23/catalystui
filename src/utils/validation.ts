/**
 * Utility functions for form validation
 */

/**
 * Validates an email address using RFC 5322 compliant regex
 * @param email The email address to validate
 * @returns boolean indicating if the email is valid
 */
export const validateEmail = (email: string): boolean => {
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates a password against security requirements
 * @param password The password to validate
 * @returns Object containing validation result and optional error message
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }

  return { isValid: true };
};

/**
 * Validates form input length
 * @param value The input value to validate
 * @param min Minimum length required
 * @param max Maximum length allowed
 * @returns Object containing validation result and optional error message
 */
export const validateLength = (
  value: string,
  min: number,
  max: number
): { isValid: boolean; message?: string } => {
  if (value.length < min) {
    return { isValid: false, message: `Must be at least ${min} characters long` };
  }
  if (value.length > max) {
    return { isValid: false, message: `Must not exceed ${max} characters` };
  }
  return { isValid: true };
};
