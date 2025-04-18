/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import {
  Loader2,
  LogOut,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  Maximize2,
  FileDown,
  Utensils,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [enlargedQR, setEnlargedQR] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await fetchStudentData(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchStudentData = async (currentUser: any) => {
    const email = currentUser.email;
    if (email.endsWith("@smail.iitm.ac.in")) {
      try {
        const q = query(
          collection(db, "students"),
          where("email", "==", email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          setStudentData({ ...studentDoc.data(), id: studentDoc.id });
          setUser(currentUser);
        } else {
          console.error("Student document not found for email:", email);
          signOut(auth);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        signOut(auth);
      }
    } else {
      console.log("Not an IITM email");
      signOut(auth);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await fetchStudentData(result.user);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!studentData) return;

    // Create a temporary anchor element
    const link = document.createElement("a");
    link.href = studentData.qr_image_url;
    link.download = `${studentData.roll_num}_qr.png`;

    // Force download instead of opening in new tab
    fetch(studentData.qr_image_url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.click();
        // Clean up
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Download failed:", err);
        // Fallback to opening in new tab
        window.open(studentData.qr_image_url, "_blank");
      });
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setStudentData(null);
    setEnlargedQR(false);
  };

  const refreshStatus = async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchStudentData(user);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  const renderFoodPreference = () => {
    if (!studentData?.preference) return null;

    let iconColor = "text-yellow-400";
    let bgColor = "bg-yellow-400/10";
    let text = "Not Specified";

    if (studentData.preference === "veg") {
      iconColor = "text-green-400";
      bgColor = "bg-green-400/10";
      text = "Vegetarian";
    } else if (studentData.preference === "non veg") {
      iconColor = "text-red-400";
      bgColor = "bg-red-400/10";
      text = "Non-Vegetarian";
    }

    return (
      <div
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${bgColor}`}
      >
        <Utensils className={`w-5 h-5 ${iconColor}`} />
        <span className={`font-medium ${iconColor}`}>{text}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-2">
      {enlargedQR && studentData?.qr_image_url && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setEnlargedQR(false)}
        >
          <div className="relative bg-white p-2 rounded-lg max-w-xl w-full mx-4">
            <img
              src={studentData.qr_image_url}
              alt="QR Code (Enlarged)"
              className="w-full h-auto"
            />
            <button
              className="absolute -top-2 -right-2 bg-gray-800 p-2 rounded-full"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {user ? (
          <div>
            {/* Header section */}
            <div className="bg-gray-700 p-6 text-center">
              <h2 className="text-2xl font-bold">{studentData?.name}</h2>
              <p className="text-gray-300 mt-1">{studentData?.roll_num}</p>

              <div className="mt-4 flex justify-center">
                {renderFoodPreference()}
              </div>
            </div>

            {/* QR code section */}
            <div className="p-2 mt-2">
              <div className="relative">
                <div className="bg-white p-3 rounded-lg shadow-lg">
                  <img
                    src={studentData?.qr_image_url}
                    alt="QR Code"
                    className="w-full object-contain"
                  />
                </div>

                <button
                  className="absolute -top-2 -right-2 bg-gray-700 p-2 rounded-full hover:bg-gray-600 transition-colors"
                  onClick={() => setEnlargedQR(true)}
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>

              {/* Status badge */}
              <div className="mt-6 flex justify-center">
                {studentData?.qr_scanned ? (
                  <div className="flex items-center bg-green-400/10 text-green-400 px-4 py-2 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    <span className="font-medium">Scanned Successfully</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-yellow-400/10 text-yellow-400 px-4 py-2 rounded-lg">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="font-medium">Pending Scan</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions section */}
            <div className="p-6 pt-2 bg-gray-800">
              <button
                className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl w-full flex items-center justify-center font-medium transition-colors gap-2"
                onClick={refreshStatus}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh Status
              </button>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors"
                  onClick={handleDownload}
                >
                  <FileDown className="w-5 h-5" />
                  Download
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Student ID Card</h2>
            <p className="text-gray-400 mb-6">
              Sign in with your IITM smail ID to access your digital ID card
            </p>
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-colors"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign in with Google"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
