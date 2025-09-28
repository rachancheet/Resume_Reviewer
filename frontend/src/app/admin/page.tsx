"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  Download, 
  Star, 
  Users, 
  TrendingUp,
  Search,
  ChevronDown,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ResumeService } from "@/lib/resume-service";
import type { Resume, User } from "@/lib/supabase";
import ReviewModal from "@/components/ReviewModal";
import AdminInviteForm from "@/components/AdminInviteForm";

// Extended Resume interface for admin view
interface AdminResumeView extends Resume {
  user?: User;
}


export default function AdminDashboard() {
  const { user, loading: authLoading, signOut, isAdmin, isSuperAdmin } = useAuth();
  const [resumes, setResumes] = useState<AdminResumeView[]>([]);
  const [selectedResume, setSelectedResume] = useState<AdminResumeView | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [resumeStats, setResumeStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    needsRevision: 0,
    rejected: 0,
    avgScore: 0
  });

  // Load all resumes and stats
  useEffect(() => {
    if (user) {
      loadAllResumes();
      loadStats();
    }
  }, [user]);

  const loadAllResumes = async () => {
    setLoading(true);
    const { resumes: allResumes, error } = await ResumeService.getAllResumes();
    
    if (error) {
      setError(error);
    } else {
      setResumes(allResumes || []);
    }
    
    setLoading(false);
  };

  const loadStats = async () => {
    const { stats: resumeStats, error } = await ResumeService.getResumeStats();
    
    if (error) {
      setError(error);
    } else if (resumeStats) {
      setResumeStats({
        total: resumeStats.total,
        pending: resumeStats.pending,
        approved: resumeStats.approved,
        needsRevision: resumeStats.needs_revision,
        rejected: resumeStats.rejected,
        avgScore: resumeStats.avg_score
      });
    }
  };

  const handleStatusUpdate = async (resumeId: string, newStatus: Resume["status"], score?: number, notes?: string) => {
    try {
      const { resume, error } = await ResumeService.updateResumeStatus(resumeId, newStatus, score, notes);
      
      if (error) {
        setError(error);
        return;
      }

      // Update local state
      setResumes(prev => prev.map(r => 
        r.id === resumeId ? { ...r, ...resume } : r
      ));
      
      // Refresh stats
      await loadStats();
      
      setShowReviewModal(false);
      setSelectedResume(null);
    } catch (error) {
      setError('Failed to update resume status');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      setError(error.message);
    }
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesStatus = statusFilter === "all" || resume.status === statusFilter;
    const matchesSearch = (resume.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Show loading screen if authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the admin dashboard</p>
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

  // Show access denied if not admin
  if (user && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don&apos;t have admin privileges to access this dashboard</p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Resume Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: Resume["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "needs_revision":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Resume["status"]) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "needs_revision":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const stats = {
    total: resumes.length,
    pending: resumes.filter(r => r.status === "pending").length,
    approved: resumes.filter(r => r.status === "approved").length,
    needsRevision: resumes.filter(r => r.status === "needs_revision").length,
    rejected: resumes.filter(r => r.status === "rejected").length,
    avgScore: Math.round(resumes.filter(r => r.score).reduce((acc, r) => acc + (r.score || 0), 0) / resumes.filter(r => r.score).length) || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Resume Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{user.profile?.email || user.email}</span>
                {isSuperAdmin() && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Super Admin
                  </span>
                )}
                {isAdmin() && !isSuperAdmin() && (
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
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {(user.profile?.email || user.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Super Admin Section */}
        {isSuperAdmin() && (
          <div className="mb-8">
            <AdminInviteForm onInviteSuccess={() => console.log('Admin invited successfully')} />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                <p className="text-2xl font-bold text-gray-900">{resumeStats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{resumeStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{resumeStats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{resumeStats.avgScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Resume Reviews */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
              {/* Search and Filter */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="needs_revision">Needs Revision</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Resume List */}
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading resumes...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredResumes.map((resume) => (
                  <div key={resume.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {resume.user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {resume.user?.email || 'Unknown User'}
                            </p>
                            <span className={getStatusBadge(resume.status)}>
                              {resume.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Resume ID: {resume.id.slice(0, 8)}...</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Uploaded {new Date(resume.created_at).toLocaleDateString()}</span>
                            {resume.updated_at !== resume.created_at && (
                              <span>Updated {new Date(resume.updated_at).toLocaleDateString()}</span>
                            )}
                            {resume.score && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="font-medium">{resume.score}/100</span>
                              </div>
                            )}
                          </div>
                          {resume.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic line-clamp-2">&quot;{resume.notes}&quot;</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {getStatusIcon(resume.status)}
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedResume(resume);
                              setShowReviewModal(true);
                            }}
                            className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            Review
                          </button>
                          <button 
                            onClick={() => window.open(resume.file_url, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="View resume"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => window.open(resume.file_url, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="Download resume"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
              
              {!loading && filteredResumes.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No resumes found</p>
                  <p className="text-sm text-gray-400">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter" 
                      : "Upload your first resume to get started"}
                  </p>
                </div>
              )}
            </div>
        </main>

      {/* Review Modal */}
      <ReviewModal
        resume={selectedResume!}
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedResume(null);
        }}
        onSubmit={(resumeId, status, score, notes) => handleStatusUpdate(resumeId, status, score, notes)}
      />
    </div>
  );
}
