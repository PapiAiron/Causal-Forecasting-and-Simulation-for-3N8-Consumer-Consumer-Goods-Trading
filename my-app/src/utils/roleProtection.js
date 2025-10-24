// utils/roleProtection.js
// Role protection system - Staff and Admin only

import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Role hierarchy - USER ROLE REMOVED
export const ROLES = {
  STAFF: 'staff',
  ADMIN: 'admin'
};

// Permission levels
export const PERMISSIONS = {
  VIEW_ANALYTICS: 'canViewAnalytics',
  EDIT_USERS: 'canEditUsers',
  MANAGE_SYSTEM: 'canManageSystem',
  DELETE_USERS: 'canDeleteUsers',
  VIEW_ALL_DATA: 'canViewAllData'
};

// Get user role from Firestore
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role || ROLES.STAFF;
    }
    return ROLES.STAFF;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return ROLES.STAFF;
  }
};

// Get user data including role and permissions
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        role: data.role || ROLES.STAFF,
        permissions: data.permissions || getDefaultPermissions(data.role || ROLES.STAFF),
        accountStatus: data.accountStatus || 'active',
        ...data
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Check if user has specific role
export const hasRole = (userRole, requiredRole) => {
  const roleLevels = {
    [ROLES.STAFF]: 1,
    [ROLES.ADMIN]: 2
  };
  
  return roleLevels[userRole] >= roleLevels[requiredRole];
};

// Check if user has specific permission
export const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions && userPermissions[requiredPermission] === true;
};

// Get default permissions for each role - NO USER ROLE
export const getDefaultPermissions = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return {
        canViewAnalytics: true,
        canEditUsers: true,
        canManageSystem: true,
        canDeleteUsers: true,
        canViewAllData: true
      };
    case ROLES.STAFF:
      return {
        canViewAnalytics: true,
        canEditUsers: true,
        canManageSystem: false,
        canDeleteUsers: false,
        canViewAllData: true
      };
    default:
      return {
        canViewAnalytics: false,
        canEditUsers: false,
        canManageSystem: false,
        canDeleteUsers: false,
        canViewAllData: false
      };
  }
};

// Check if user account is active
export const isAccountActive = (accountStatus) => {
  return accountStatus === 'active';
};

// Route protection component
export const ProtectedRoute = ({ children, requiredRole, userRole, fallback }) => {
  if (hasRole(userRole, requiredRole)) {
    return children;
  }
  
  return fallback || (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

// Permission-based component wrapper
export const WithPermission = ({ children, requiredPermission, userPermissions, fallback }) => {
  if (hasPermission(userPermissions, requiredPermission)) {
    return children;
  }
  
  return fallback || null;
};

// Check multiple permissions (user must have ALL)
export const hasAllPermissions = (userPermissions, requiredPermissions = []) => {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
};

// Check multiple permissions (user must have ANY)
export const hasAnyPermission = (userPermissions, requiredPermissions = []) => {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
};

// Validate user session and role
export const validateUserSession = async () => {
  const user = auth.currentUser;
  if (!user) {
    return { valid: false, reason: 'not_authenticated' };
  }

  if (!user.emailVerified) {
    return { valid: false, reason: 'email_not_verified' };
  }

  const userData = await getUserData(user.uid);
  
  if (!userData) {
    return { valid: false, reason: 'user_data_not_found' };
  }

  if (!isAccountActive(userData.accountStatus)) {
    return { valid: false, reason: 'account_not_active', status: userData.accountStatus };
  }

  return {
    valid: true,
    user: {
      uid: user.uid,
      email: user.email,
      role: userData.role,
      permissions: userData.permissions,
      accountStatus: userData.accountStatus
    }
  };
};

// Role display names - NO USER
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.STAFF]: 'Staff',
    [ROLES.ADMIN]: 'Administrator'
  };
  return displayNames[role] || 'Unknown';
};

// Permission display names
export const getPermissionDisplayName = (permission) => {
  const displayNames = {
    [PERMISSIONS.VIEW_ANALYTICS]: 'View Analytics',
    [PERMISSIONS.EDIT_USERS]: 'Edit Users',
    [PERMISSIONS.MANAGE_SYSTEM]: 'Manage System',
    [PERMISSIONS.DELETE_USERS]: 'Delete Users',
    [PERMISSIONS.VIEW_ALL_DATA]: 'View All Data'
  };
  return displayNames[permission] || permission;
};

// Get available roles for dropdown/selection - ONLY STAFF AND ADMIN
export const getAvailableRoles = () => {
  return Object.values(ROLES).map(role => ({
    value: role,
    label: getRoleDisplayName(role)
  }));
};

// Get available permissions for UI
export const getAvailablePermissions = () => {
  return Object.values(PERMISSIONS).map(permission => ({
    value: permission,
    label: getPermissionDisplayName(permission)
  }));
};

export default {
  ROLES,
  PERMISSIONS,
  getUserRole,
  getUserData,
  hasRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getDefaultPermissions,
  isAccountActive,
  validateUserSession,
  getRoleDisplayName,
  getPermissionDisplayName,
  getAvailableRoles,
  getAvailablePermissions,
  ProtectedRoute,
  WithPermission
};