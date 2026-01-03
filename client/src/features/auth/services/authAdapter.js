/**
 * Adapter to transform login credentials to server payload format
 * @param {Object} credentials - { email, password }
 * @returns {Object} - { emailId, password }
 */
export const toServerLoginPayload = (credentials) => {
  return {
    emailId: credentials.email,
    password: credentials.password
  };
};

/**
 * Adapter to transform server user object to client user object
 * @param {Object} serverUser - User object from server response
 * @returns {Object} - User object for client state
 */
export const fromServerUser = (serverUser) => {
  return {
    id: serverUser._id,
    name: serverUser.name,
    email: serverUser.emailId,
    role: serverUser.role,
    employeeId: serverUser.employeeId,
    department: serverUser.department,
    school: serverUser.school
  };
};
