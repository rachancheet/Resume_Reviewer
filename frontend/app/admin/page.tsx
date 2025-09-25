"use client";

import { useState } from "react";
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
  Filter,
  Search,
  ChevronDown,
  MessageSquare,
  Calendar,
  Award,
  BarChart3
} from "lucide-react";
import Link from "next/link";

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  fileName: string;
  uploadDate: string;
  status: "pending" | "approved" | "needs_revision" | "rejected";
  score?: number;
  notes?: string;
  fileSize: string;
  reviewedBy?: string;
  reviewDate?: string;
}

// Mock data for demonstration
const mockResumes: Resume[] = [
  {
    id: "1",
    candidateName: "John Doe",
    candidateEmail: "john.doe@email.com",
    fileName: "john_doe_resume.pdf",
    uploadDate: "2024-01-15",
    status: "pending",
    fileSize: "245 KB"
  },
  {
    id: "2",
    candidateName: "Jane Smith",
    candidateEmail: "jane.smith@email.com",
    fileName: "jane_smith_cv.pdf",
    uploadDate: "2024-01-14",
    status: "approved",
    score: 85,
    notes: "Strong technical background, excellent formatting. Great experience in React and Node.js",
    fileSize: "189 KB",
    reviewedBy: "Admin",
    reviewDate: "2024-01-16"
  },
  {
    id: "3",
    candidateName: "Alex Johnson",
    candidateEmail: "alex.johnson@email.com",
    fileName: "alex_johnson_resume.pdf",
    uploadDate: "2024-01-13",
    status: "needs_revision",
    score: 72,
    notes: "Good experience but needs better project descriptions and clearer skill section",
    fileSize: "267 KB",
    reviewedBy: "Admin",
    reviewDate: "2024-01-15"
  },
  {
    id: "4",
    candidateName: "Sarah Wilson",
    candidateEmail: "sarah.wilson@email.com",
    fileName: "sarah_wilson_resume.pdf",
    uploadDate: "2024-01-12",
    status: "rejected",
    score: 45,
    notes: "Insufficient experience for the position requirements",
    fileSize: "156 KB",
    reviewedBy: "Admin",
    reviewDate: "2024-01-14"
  },
  {
    id: "5",
    candidateName: "Mike Chen",
    candidateEmail: "mike.chen@email.com",
    fileName: "mike_chen_cv.pdf",
    uploadDate: "2024-01-11",
    status: "approved",
    score: 92,
    notes: "Excellent candidate with strong portfolio and relevant experience",
    fileSize: "298 KB",
    reviewedBy: "Admin",
    reviewDate: "2024-01-13"
  }
];

const leaderboardData = [
  { rank: 1, name: "Mike Chen", score: 92, status: "approved" },
  { rank: 2, name: "Jane Smith", score: 85, status: "approved" },
  { rank: 3, name: "Alex Johnson", score: 72, status: "needs_revision" },
  { rank: 4, name: "Sarah Wilson", score: 45, status: "rejected" }
];

export default function AdminDashboard() {
  const [resumes, setResumes] = useState<Resume[]>(mockResumes);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"resumes" | "leaderboard">("resumes");

  const handleStatusUpdate = (resumeId: string, newStatus: Resume["status"], score?: number, notes?: string) => {
    setResumes(prev => prev.map(resume => 
      resume.id === resumeId 
        ? { 
            ...resume, 
            status: newStatus, 
            score, 
            notes,
            reviewedBy: "Admin",
            reviewDate: new Date().toISOString().split('T')[0]
          }
        : resume
    ));
    setShowReviewModal(false);
    setSelectedResume(null);
  };

  const filteredResumes = resumes.filter(resume => {
    const matchesStatus = statusFilter === "all" || resume.status === statusFilter;
    const matchesSearch = resume.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
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
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">AD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("resumes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "resumes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Resume Reviews</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "leaderboard"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4" />
                  <span>Leaderboard</span>
                </div>
              </button>
            </nav>
          </div>

          {activeTab === "resumes" && (
            <div>
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
                      className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
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
              <div className="divide-y divide-gray-200">
                {filteredResumes.map((resume) => (
                  <div key={resume.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {resume.candidateName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {resume.candidateName}
                            </p>
                            <span className={getStatusBadge(resume.status)}>
                              {resume.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{resume.candidateEmail}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{resume.fileName}</span>
                            <span>{resume.fileSize}</span>
                            <span>Uploaded {new Date(resume.uploadDate).toLocaleDateString()}</span>
                            {resume.score && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="font-medium">{resume.score}/100</span>
                              </div>
                            )}
                          </div>
                          {resume.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic line-clamp-2">"{resume.notes}"</p>
                          )}
                          {resume.reviewedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              Reviewed by {resume.reviewedBy} on {new Date(resume.reviewDate!).toLocaleDateString()}
                            </p>
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
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resume Score Leaderboard</h3>
              </div>
              
              <div className="space-y-4">
                {leaderboardData.map((candidate) => (
                  <div key={candidate.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        candidate.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        candidate.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        candidate.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{candidate.rank}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{candidate.name}</p>
                        <span className={getStatusBadge(candidate.status as Resume["status"])}>
                          {candidate.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-lg">{candidate.score}</span>
                      <span className="text-gray-500">/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Resume</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Candidate: {selectedResume.candidateName}</p>
              <p className="text-sm text-gray-600">File: {selectedResume.fileName}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusUpdate(selectedResume.id, "approved", 85, "Approved - meets requirements")}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedResume.id, "needs_revision", 65, "Needs revision - minor improvements needed")}
                  className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Needs Revision
                </button>
              </div>
              <button
                onClick={() => handleStatusUpdate(selectedResume.id, "rejected", 35, "Rejected - does not meet requirements")}
                className="w-full px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
