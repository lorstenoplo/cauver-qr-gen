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
  DownloadCloud,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

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
        // Query students collection where email field matches the user's email
        const q = query(
          collection(db, "students"),
          where("email", "==", email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Get the first matching document
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
    } catch (error) {
      alert((error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!studentData) return;
    const qrImageUrl = studentData.qr_image_url;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.target = "_blank";
    link.download = `${studentData.roll_num}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setStudentData(null);
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
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="w-full max-w-md bg-gray-800 p-4 rounded-2xl shadow-xl">
        {user ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Welcome, {studentData?.name}
            </h2>
            <p className="text-gray-400">{studentData?.roll_num}</p>
            <img
              src={studentData?.qr_image_url}
              alt="QR Code"
              className="mt-4 mx-auto w-[99%] object-contain bg-gray-700 rounded-lg shadow-lg"
            />
            <div className="mt-4 flex items-center justify-center gap-2">
              {studentData?.qr_scanned ? (
                <div className="flex items-center text-green-400">
                  <CheckCircle2 className="w-6 h-6 mr-2" /> Scanned Successfully
                </div>
              ) : (
                <div className="flex items-center text-yellow-400">
                  <Clock className="w-6 h-6 mr-2" /> Pending Scan
                </div>
              )}
            </div>
            {/* Food prefernce */}
            <div className="mt-4 text-gray-400">
              {studentData?.preference === "veg" ? (
                <p className="text-green-400">Food Preference: Vegetarian</p>
              ) : studentData?.preference === "non veg" ? (
                <p className="text-red-400">Food Preference: Non-Vegetarian</p>
              ) : (
                <p className="text-yellow-400">
                  Food Preference: Not Specified
                </p>
              )}
            </div>

            <button
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-xl w-full mt-4 flex items-center justify-center font-medium transition-all duration-200 gap-2"
              onClick={refreshStatus}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <div className="flex gap-4">
              <button
                className="mt-4 w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-all duration-200"
                onClick={handleDownload}
              >
                <DownloadCloud className="w-5 h-5" /> Download
              </button>
              <button
                className="mt-4 w-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-all duration-200"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>
            <p className="text-gray-400 mb-6">Use your IITM smail ID</p>
            <button
              className="w-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-all duration-200"
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
