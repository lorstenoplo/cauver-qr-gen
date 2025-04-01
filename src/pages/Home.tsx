import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Loader2, LogOut } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);

  const handleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      if (!email!.endsWith('@smail.iitm.ac.in')) {
        throw new Error('Use your IITM smail ID');
      }
      const rollNum = email!.split('@')[0].toUpperCase();
      
      const studentRef = doc(db, 'students', rollNum);
      const studentDoc = await getDoc(studentRef);
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
        setUser(result.user);
      } else {
        throw new Error('Student record not found');
      }
    } catch (error) {
      alert((error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setStudentData(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-2xl shadow-xl">
        {user ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome, {studentData?.name}</h2>
            <p className="text-gray-400">{studentData?.roll_num}</p>
            <img 
              src={studentData?.qr_image_url} 
              alt="QR Code" 
              className="mt-4 mx-auto w-40 h-40 bg-gray-700 rounded-lg shadow-lg" 
            />
            <button 
              className="mt-4 py-4 px-6 rounded-xl w-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2" 
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
            
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>
            <p className="text-gray-400 mb-6">Use your IITM smail ID</p>
            <button 
              className="w-full py-4 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2" 
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in with Google'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}