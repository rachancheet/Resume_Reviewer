"use client";

import { FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/supabase";
import CandidateDashboard from "@/components/CandidateDashboard";
import AdminDashboard from "@/components/AdminDashboard";

interface AuthUser {
  id: string;
  email: string;
  display_name?: string | null;
  profile?: User | null;
}

export default function Dashboard() {
  const { getUser } = useAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setLoading(true);
      console.log("tring to fetch user")
      const fetchedUser = await getUser();
      console.log("got user", fetchedUser)
      if (mounted) {
        if (!fetchedUser) {
          console.error('Error fetching user:');
          setUser(null);
        } else {
          setUser(fetchedUser);
        }
      }
      setLoading(false);
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [getUser]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error.message);
    } else {
      setUser(null);
    }
  };

  const isAdmin = Boolean(
    user?.profile?.role === "admin" || user?.profile?.role === "super_admin"
  );
  const isSuperAdmin = Boolean(user?.profile?.role === "super_admin");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume Platform</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <img src="/resume-icon-16.jpg" alt="Resume Platform" className="w-8 h-8" />
                <h1 className="text-xl font-bold text-gray-900">
                  {isAdmin ? "Admin Dashboard" : "Resume Platform"}
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{user.display_name || user.profile?.email || user.email}</span>
                {isSuperAdmin && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Super Admin
                  </span>
                )}
                {isAdmin && !isSuperAdmin && (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                    Admin
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                  <span className="text-white font-medium text-sm">
                    {(user.display_name || user.profile?.email || user.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isAdmin ? (
        <AdminDashboard user={user} isSuperAdmin={() => isSuperAdmin} />
      ) : (
        <CandidateDashboard user={user} />
      )}
    </div>
  );
}