import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { useTheme } from "../components/ThemeContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  addDoc  // ADDED: Import addDoc for creating notifications
} from "firebase/firestore";
import { CheckCircle, XCircle, Clock, Mail, Trash2, RefreshCw } from "lucide-react";

const AdminUserVerification = () => {
  const { theme } = useTheme();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    checkAdminStatus();
    fetchPendingUsers();
  }, []);

  const checkAdminStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDocs(
        query(collection(db, "users"), where("email", "==", user.email))
      );
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setCurrentUserRole(userData.role);
      }
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      
      // Get users where accountStatus is pending
      const q = query(
        usersRef,
        where("accountStatus", "==", "pending")
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData,
        });
      });
      
      setPendingUsers(users);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      alert("Error loading pending users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userEmail, userName) => {
    if (!window.confirm(`Approve ${userName} (${userEmail})?`)) return;

    try {
      setProcessing(userId);
      const userRef = doc(db, "users", userId);
      
      // FIXED: Set account to active and verify email
      await updateDoc(userRef, {
        accountStatus: "active",
        emailVerifiedByAdmin: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: auth.currentUser?.email || "admin",
      });

      // FIXED: Send notification to user using addDoc
      await addNotification(userId, {
        type: "account_verified",
        title: "Account Verified ✅",
        message: `Congratulations ${userName}! Your account has been verified by an administrator. You can now log in to the system.`,
        read: false,
      });

      alert(`${userName} has been approved successfully! Their account is now active.`);
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Error approving user: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId, userEmail, userName) => {
    const reason = window.prompt(
      `Reject ${userName} (${userEmail})?\n\nEnter rejection reason (optional):`
    );
    
    if (reason === null) return; // User cancelled

    try {
      setProcessing(userId);
      const userRef = doc(db, "users", userId);
      
      // Mark as rejected (keep record)
      await updateDoc(userRef, {
        accountStatus: "rejected",
        emailVerifiedByAdmin: false,
        rejectedAt: serverTimestamp(),
        rejectedBy: auth.currentUser?.email || "admin",
        rejectionReason: reason || "No reason provided",
      });

      // FIXED: Send notification to user using addDoc
      await addNotification(userId, {
        type: "account_rejected",
        title: "Account Verification Failed ❌",
        message: reason || "Your account verification was not approved. Please contact support for more information.",
        read: false,
      });

      alert(`${userName} has been rejected.`);
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Error rejecting user: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (userId, userEmail, userName) => {
    if (!window.confirm(
      `DELETE ${userName} (${userEmail})?\n\nThis action cannot be undone!`
    )) return;

    try {
      setProcessing(userId);
      const userRef = doc(db, "users", userId);
      
      // Delete user document
      await deleteDoc(userRef);

      alert(`${userName} has been permanently deleted.`);
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user: " + error.message);
    } finally {
      setProcessing(null);
    }
  };

  // FIXED: Proper notification creation using addDoc
  const addNotification = async (userId, notificationData) => {
    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: userId,
        createdAt: serverTimestamp(),
        ...notificationData,
      });
      console.log(`Notification sent to user ${userId}`);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  if (currentUserRole !== "admin") {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Pending User Verifications
        </h1>
        <button
          onClick={fetchPendingUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-white mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading users...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            All Caught Up!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No pending user verifications at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4"
              style={{ borderLeftColor: theme.chart }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock size={20} className="text-yellow-500" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {user.name || user.displayName || "Unnamed User"}
                    </h3>
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor:
                          user.role === "admin" ? "#ef4444" : "#3b82f6",
                        color: "white",
                      }}
                    >
                      {user.role?.toUpperCase() || "STAFF"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      Registered: {formatDate(user.createdAt)}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Status: </span>
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {user.accountStatus || "pending"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Email Verified by Admin: </span>
                      <span
                        className={
                          user.emailVerifiedByAdmin
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {user.emailVerifiedByAdmin ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(user.id, user.email, user.name || user.displayName || "User")}
                    disabled={processing === user.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(user.id, user.email, user.name || user.displayName || "User")}
                    disabled={processing === user.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>

                  <button
                    onClick={() => handleDelete(user.id, user.email, user.name || user.displayName || "User")}
                    disabled={processing === user.id}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>

              {processing === user.id && (
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                  Processing...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUserVerification;