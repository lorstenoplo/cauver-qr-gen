/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Search,
  User,
  Database,
  RotateCcw,
  Loader2,
  Lock,
  LogOut,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link } from "react-router-dom";

export default function StudentSearch() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [updatingStudent, setUpdatingStudent] = useState<string | null>(null);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load recently scanned students on initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadRecentStudents();
    }
  }, [isAuthenticated]);

  // Handle login for admin authentication
  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid email or password. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setAuthLoading(false);
    }
  };

  // Load recently scanned students
  const loadRecentStudents = async () => {
    try {
      setLoading(true);
      const studentsRef = collection(db, "students");
      const q = query(
        studentsRef,
        where("qr_scanned", "==", true),
        orderBy("scanned_at", "desc"),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      const recentData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecentStudents(recentData);
    } catch (error) {
      console.error("Error loading recent students:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search for students by name or roll number
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    setStudents([]);
    setError("");

    try {
      const studentsRef = collection(db, "students");

      // Create queries for name and roll number
      const nameQuery = query(
        studentsRef,
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + "\uf8ff")
      );

      const rollQuery = query(
        studentsRef,
        where("roll_num", ">=", searchTerm.toUpperCase()),
        where("roll_num", "<=", searchTerm.toUpperCase() + "\uf8ff")
      );

      // Execute both queries
      const [nameSnapshot, rollSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(rollQuery),
      ]);

      // Combine results and remove duplicates
      const results = new Map();

      nameSnapshot.forEach((doc) => {
        results.set(doc.id, { id: doc.id, ...doc.data() });
      });

      rollSnapshot.forEach((doc) => {
        results.set(doc.id, { id: doc.id, ...doc.data() });
      });

      const searchResults = Array.from(results.values());

      if (searchResults.length === 0) {
        setError("No students found matching your search.");
      } else {
        setStudents(searchResults);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setError(`Error searching: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  // Toggle student scan status
  const toggleScanStatus = async (
    studentId: string,
    currentStatus: boolean
  ) => {
    try {
      setUpdatingStudent(studentId);
      const studentRef = doc(db, "students", studentId);

      const updateData: { qr_scanned: boolean; scanned_at?: Date } = {
        qr_scanned: !currentStatus,
      };

      // If changing to scanned, add timestamp; if changing to not scanned, remove timestamp
      if (!currentStatus) {
        updateData.scanned_at = new Date();
      }

      await updateDoc(studentRef, updateData);

      // Update state to reflect the change
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentId
            ? {
                ...student,
                qr_scanned: !currentStatus,
                scanned_at: !currentStatus ? new Date() : student.scanned_at,
              }
            : student
        )
      );

      setRecentStudents((prevRecent) => {
        // If turning off scanning for a student in recent list
        if (currentStatus) {
          return prevRecent.filter((s) => s.id !== studentId);
        }
        // If turning on scanning, check if student is in results and should be added to recent
        const studentToAdd = students.find((s) => s.id === studentId);
        if (studentToAdd) {
          return [
            { ...studentToAdd, qr_scanned: true, scanned_at: new Date() },
            ...prevRecent.slice(0, 4),
          ];
        }
        return prevRecent;
      });

      setSuccess(
        `Successfully ${
          !currentStatus ? "marked" : "unmarked"
        } student's scan status.`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Update error:", error);
      setError(`Error updating scan status: ${error.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdatingStudent(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="h-full flex flex-col max-w-md mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Database className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-bold">Student Search</h1>
          </div>
          <p className="text-gray-400">Find and manage student scan status</p>
        </header>

        {!isAuthenticated ? (
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-yellow-400" /> Admin Login
            </h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 p-3 bg-gray-700 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-3 bg-gray-700 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
              disabled={authLoading}
            >
              Login
              {authLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            </button>
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <main className="flex-1 flex flex-col gap-6">
            {/* Search bar */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg flex items-center">
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 p-4 bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchTerm.trim()}
                className="p-4 text-blue-400 hover:text-blue-300 disabled:text-gray-500"
              >
                {searching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-200">{success}</p>
              </div>
            )}

            {/* Search Results */}
            {students.length > 0 && (
              <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                <h2 className="p-4 text-lg font-medium text-gray-300 border-b border-gray-700 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Search Results
                </h2>
                <div className="divide-y divide-gray-700">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-lg">
                            {student.name}
                          </h3>
                          <p className="text-gray-400">{student.roll_num}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {student.qr_scanned
                              ? `Scanned: ${
                                  student.scanned_at
                                    ? new Date(
                                        student.scanned_at.toDate()
                                      ).toLocaleString()
                                    : "Yes"
                                }`
                              : "Not Scanned"}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            toggleScanStatus(student.id, student.qr_scanned)
                          }
                          disabled={updatingStudent === student.id}
                          className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-all ${
                            student.qr_scanned
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          }`}
                        >
                          {updatingStudent === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : student.qr_scanned ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              Unmark
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Mark Scanned
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Scans */}
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg mt-4">
              <h2 className="p-4 text-lg font-medium text-gray-300 border-b border-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-400" />
                  Recent Scans
                </span>
                <button
                  onClick={loadRecentStudents}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </h2>
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              ) : recentStudents.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-lg">
                            {student.name}
                          </h3>
                          <p className="text-gray-400">{student.roll_num}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {student.scanned_at
                              ? `Scanned: ${new Date(
                                  student.scanned_at.toDate()
                                ).toLocaleString()}`
                              : "Scanned"}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleScanStatus(student.id, true)}
                          disabled={updatingStudent === student.id}
                          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-1 text-sm font-medium transition-all"
                        >
                          {updatingStudent === student.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Unmark
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No recent scans found
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex gap-3 mt-6">
              <Link
                to="/scanner"
                className="flex-1 bg-blue-500 hover:bg-blue-600 p-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Scanner
              </Link>

              <button
                onClick={() => {
                  auth.signOut();
                  setIsAuthenticated(false);
                }}
                className="flex items-center justify-center gap-2 p-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-all duration-200"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
