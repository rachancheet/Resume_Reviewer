"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle, Clock, XCircle, Eye, Download, Star, Award, Trophy, Medal, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ResumeService } from "@/lib/resume-service";
import FileUpload from "@/components/FileUpload";
import type { Resume } from "@/lib/supabase";
import { redirect } from 'next/navigation';


export default function ResumeDashboard() {


  const { user, loading: authLoading, signOut, isAdmin } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<Array<{
    rank: number
    name: string
    email: string
    score: number
    status: Resume['status']
  }>>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "leaderboard">("dashboard");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const loadResumes = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { resumes: userResumes, error } = await ResumeService.getUserResumes(user.id);
    
    if (error) {
      setError(error);
    } else {
      setResumes(userResumes || []);
    }
    
    setLoading(false);
  }, [user]);

  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    const { leaderboard, error } = await ResumeService.getLeaderboard();
    
    if (error) {
      setError(error);
    } else {
      setLeaderboardData(leaderboard || []);
    }
    
    setLoadingLeaderboard(false);
  }, []);

  useEffect(() => {
    console.log("user profile changed",user)
    if (user && !authLoading) {
      loadResumes();
      if (isAdmin()) {
        redirect("/admin");
      }
    }
  }, [user, authLoading, loadResumes, isAdmin]);

  useEffect(() => {
    if (activeTab === 'leaderboard' && leaderboardData.length === 0) {
      loadLeaderboard();
    }
  }, [activeTab, leaderboardData.length, loadLeaderboard]);



  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setMessage('');

    try {
      const { url: fileUrl, error: uploadError } = await ResumeService.uploadResumeFile(
        selectedFile, 
        user.id,
        (progress) => setUploadProgress(progress)
      );
      
      if (uploadError) {
        setError(uploadError);
        setUploading(false);
        setUploadProgress(0);
        return;
      }

 const { resume, error: createError } = await ResumeService.createResume(user.id, user.profile?.email || user.email || '', fileUrl!, selectedFile.name);
      
      setUploadProgress(100);

      if (createError) {
        setError(createError);
      } else {
        setMessage('Resume uploaded successfully!');
        setSelectedFile(null);
        await loadResumes(); 
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setMessage('');
      }, 2000);
    }
  };

  const handleDownload = async (resume: Resume) => {
    try {
      setError(''); // Clear any previous errors
      
      // Create a more robust download function
      const response = await fetch(resume.file_url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume_${new Date(resume.created_at).toLocaleDateString().replace(/\//g, '_')}.pdf`;
      link.style.display = 'none'; // Hide the link
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download resume. Please try again.');
      
      // Fallback: open in new tab if download fails
      window.open(resume.file_url, '_blank');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      setError(error.message);
    }
  };

  if (authLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Resume Platform</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin() && (
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Admin Dashboard
                </Link>
              )}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{user.profile?.email || user.email}</span>
                {isAdmin() && (
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
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Resume Dashboard</h2>
          <p className="text-gray-600">Upload your resume and track its review status</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>My Resumes</span>
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
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard</span>
                </div>
              </button>
            </nav>
          </div>

          {activeTab === "dashboard" && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Resume</h3>
                
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  error={error}
                />

                {selectedFile && !uploading && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleUpload}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Upload Resume
                    </button>
                  </div>
                )}

                {message && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{message}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Your Resumes</h3>
                </div>

                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your resumes...</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-200">
                      {resumes.map((resume) => (
                        <div key={resume.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-shrink-0">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    resume_{new Date(resume.created_at).toLocaleDateString().replace(/\//g, '_')}.pdf
                                  </p>
                                  <span className={getStatusBadge(resume.status)}>
                                    {resume.status.replace("_", " ").toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Uploaded {new Date(resume.created_at).toLocaleDateString()}</span>
                                  {resume.score && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span className="font-medium">{resume.score}/100</span>
                                    </div>
                                  )}
                                </div>
                                {resume.notes && (
                                  <p className="text-xs text-gray-600 mt-1 italic">&quot;{resume.notes}&quot;</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              {getStatusIcon(resume.status)}
                              <div className="flex items-center space-x-2">
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

                    {resumes.length === 0 && (
                      <div className="p-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">No resumes uploaded yet</p>
                        <p className="text-sm text-gray-400">Upload your first resume to get started</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Trophy className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resume Score Leaderboard</h3>
                <div className="flex items-center space-x-1 text-xs text-gray-500 ml-auto">
                  <Award className="w-3 h-3" />
                  <span>See how you rank among all candidates</span>
                </div>
              </div>
              
              {loadingLeaderboard ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading leaderboard...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No scored resumes yet</p>
                  <p className="text-sm text-gray-400">Submit and get your resume reviewed to appear on the leaderboard</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardData.map((candidate) => (
                  <div key={candidate.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        candidate.rank === 1 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                        candidate.rank === 2 ? 'bg-gray-100 text-gray-800 border-2 border-gray-300' :
                        candidate.rank === 3 ? 'bg-orange-100 text-orange-800 border-2 border-orange-300' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {candidate.rank <= 3 ? (
                          candidate.rank === 1 ? <Trophy className="w-5 h-5" /> :
                          candidate.rank === 2 ? <Medal className="w-5 h-5" /> :
                          <Award className="w-5 h-5" />
                        ) : (
                          `#${candidate.rank}`
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{candidate.name}</p>
                        <span className={getStatusBadge(candidate.status as Resume["status"])}>
                          {candidate.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-bold text-lg">{candidate.score}</span>
                          <span className="text-gray-500">/100</span>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              candidate.score >= 80 ? 'bg-green-500' :
                              candidate.score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${candidate.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}

              {user && leaderboardData.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Your Current Ranking</span>
                  </div>
                  {(() => {
                    const userRanking = leaderboardData.find(item => item.email === (user.profile?.email || user.email));
                    if (userRanking) {
                      return (
                        <p className="text-xs text-blue-700">
                          You&apos;re currently ranked #{userRanking.rank} with a score of {userRanking.score}/100. 
                          {userRanking.rank === 1 ? ' Congratulations on the top spot!' : ' Keep improving to climb higher!'}
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-xs text-blue-700">
                          Submit a resume and get it reviewed to appear on the leaderboard!
                        </p>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}