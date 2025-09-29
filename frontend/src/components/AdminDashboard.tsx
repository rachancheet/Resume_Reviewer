"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye, 
  Download, 
  Star, 
  Users, 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { ResumeService } from "@/lib/resume-service";
import type { Resume } from "@/lib/supabase";
import ReviewModal from "@/components/ReviewModal";
import AdminInviteForm from "@/components/AdminInviteForm";

interface AdminDashboardProps {
  user: any;
  isSuperAdmin: () => boolean;
}

export default function AdminDashboard({ user, isSuperAdmin }: AdminDashboardProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = newest first
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

  const loadAllResumes = useCallback(async () => {
    setLoading(true);
    const { resumes: allResumes, error } = await ResumeService.getAllResumes();
    console.log("allresumes", allResumes);
    
    if (error) {
      setError(error);
    } else {
      setResumes(allResumes || []);
    }
    
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (user) {
      loadAllResumes();
      loadStats();
    }
  }, [user, loadAllResumes, loadStats]);

  const handleStatusUpdate = useCallback(async (resumeId: string, newStatus: Resume["status"], score?: number, notes?: string) => {
    try {
      const { resume, error } = await ResumeService.updateResumeStatus(resumeId, newStatus, score, notes);
      
      if (error) {
        setError(error);
        return;
      }

      setResumes(prev => prev.map(r => 
        r.id === resumeId ? { ...r, ...resume } : r
      ));
      
      await loadStats();
      
      setShowReviewModal(false);
      setSelectedResume(null);
    } catch (error) {
      setError('Failed to update resume status');
    }
  }, [loadStats]);

  const handleDownload = async (resume: Resume) => {
    try {
      setError('');
      
      const response = await fetch(resume.file_url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.file_name || `resume_${resume.user_name?.split('@')[0] || 'user'}_${new Date(resume.created_at).toLocaleDateString().replace(/\//g, '_')}.pdf`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download resume. Please try again.');
      window.open(resume.file_url, '_blank');
    }
  };

  const filteredResumes = resumes
    .filter(resume => {
      const matchesStatus = statusFilter === "all" || resume.status === statusFilter;
      const matchesSearch = (resume.user_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {isSuperAdmin() && (
        <div className="mb-8">
          <AdminInviteForm user={user} onInviteSuccess={() => console.log('Admin invited successfully')} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
      </div>

      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === "all"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  All ({resumes.length})
                </button>
                
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === "pending"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Pending ({resumes.filter(r => r.status === "pending").length})
                </button>
                
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === "approved"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Approved ({resumes.filter(r => r.status === "approved").length})
                </button>
                
                <button
                  onClick={() => setStatusFilter("needs_revision")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === "needs_revision"
                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Needs Revision ({resumes.filter(r => r.status === "needs_revision").length})
                </button>
                
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === "rejected"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Rejected ({resumes.filter(r => r.status === "rejected").length})
                </button>
              </div>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                title={`Sort by date ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
              >
                {sortOrder === 'desc' ? (
                  <ArrowDown className="w-4 h-4" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
                <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading resumes...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredResumes.map((resume) => (
            <div 
              key={resume.id} 
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setSelectedResume(resume);
                setShowReviewModal(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {resume.user_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {resume.user_name || 'Unknown User'}
                      </p>
                      <span className={getStatusBadge(resume.status)}>
                        {resume.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {resume.file_name && <span className="font-medium">File: {resume.file_name}</span>}
                      {resume.file_name && <span className="mx-2">•</span>}
                      Resume ID: {resume.id.slice(0, 8)}...
                    </p>
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

                <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
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
                      onClick={() => handleDownload(resume)}
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

      <ReviewModal
        resume={selectedResume!}
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedResume(null);
        }}
        onSubmit={(resumeId, status, score, notes) => handleStatusUpdate(resumeId, status, score, notes)}
      />
    </main>
  );
}