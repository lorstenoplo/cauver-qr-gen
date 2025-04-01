import { useState, useRef, useCallback } from "react";
import QrReader from "react-qr-scanner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Camera, XCircle, CheckCircle2, Loader2, Lock, LogOut } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const processingRef = useRef(false);

  const handleScan = useCallback(
    async (data: { text: any }) => {
      if (!data || processingRef.current || !isAuthenticated) return;
      processingRef.current = true;
      setLoading(true);

      try {
        const decodedText = data.text;
        const parsedData = JSON.parse(decodedText);

        if (!parsedData.roll_num) {
          throw new Error("Invalid QR code format");
        }

        const studentRef = doc(db, "students", parsedData.roll_num);
        const studentDoc = await getDoc(studentRef);

        if (!studentDoc.exists()) {
          throw new Error("Student not found in database");
        }

        const studentRecord = studentDoc.data();
        if (studentRecord.qr_scanned) {
          const scannedDate = new Date(
            studentRecord.scanned_at.toDate()
          ).toLocaleString();
          throw new Error(
            `${studentRecord.name} has already scanned at ${scannedDate}`
          );
        }

        await updateDoc(studentRef, {
          qr_scanned: true,
          scanned_at: new Date(),
        });

        setSuccess("✓ Food coupon validated successfully!");
        setStudentData({
          name: studentRecord.name,
          roll_num: parsedData.roll_num,
          department: studentRecord.department,
          year: studentRecord.year,
          scanned_at: new Date().toLocaleString(),
        });

        setTimeout(() => {
          setSuccess("");
          setStudentData(null);
          processingRef.current = false;
        }, 5000);
      } catch (error) {
        setError((error as any).message);
        setTimeout(() => {
          setError("");
          processingRef.current = false;
        }, 3000);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const handleError = useCallback((err: any) => {
    console.error(err);
    setError("Camera error. Please check permissions and try again.");
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="h-full flex flex-col max-w-md mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Camera className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">QR Scanner</h1>
          </div>
          <p className="text-gray-400">Scan food coupon QR codes</p>
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
              Unlock Scanner
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
            <div className="relative rounded-2xl overflow-hidden bg-gray-800 shadow-xl">
              {scanning ? (
                <div className="aspect-[4/3]">
                  <QrReader
                    delay={100}
                    onError={handleError}
                    onScan={handleScan}
                    constraints={{
                      video: {
                        facingMode: "environment",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 },
                      },
                    }}
                    style={{ width: "100%", height: "100%" }}
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-700 flex items-center justify-center">
                  <p className="text-gray-400">Camera inactive</p>
                </div>
              )}
            </div>

            <button
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                scanning
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => setScanning(!scanning)}
            >
              <Camera className="w-5 h-5" />
              {scanning ? "Stop" : "Start"} Scanning
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-200">{success}</p>
              </div>
            )}

            {studentData && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-300">
                  Student Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name</span>
                    <span className="font-medium">{studentData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Roll Number</span>
                    <span className="font-medium">{studentData.roll_num}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scanned At</span>
                    <span className="font-medium">
                      {studentData.scanned_at}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* sign out button */}
            <button
              onClick={() => {
                auth.signOut();
                setIsAuthenticated(false);
              }}
              className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </main>
        )}
      </div>
    </div>
  );
}
