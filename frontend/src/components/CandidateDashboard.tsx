"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle, Clock, XCircle, Eye, Download, Star, Award, Trophy, Medal, Trash2 } from "lucide-react";
import { ResumeService } from "@/lib/resume-service";
import { supabase } from "@/lib/supabase";
import FileUpload from "@/components/FileUpload";
import ResumeViewModal from "@/components/ResumeViewModal";
import type { Resume } from "@/lib/supabase";
import type { AuthUser } from "@/hooks/useAuth";

// AuthUser type now imported from hooks/useAuth to avoid duplicate definitions

interface CandidateDashboardProps {
  user: AuthUser;
}

export default function CandidateDashboard({ user }: CandidateDashboardProps) {
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
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

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
    if (user) {
      loadResumes();
    }
  }, [user, loadResumes]);

  useEffect(() => {
    if (activeTab === 'leaderboard' && leaderboardData.length === 0) {
      loadLeaderboard();
    }
  }, [activeTab, leaderboardData.length, loadLeaderboard]);

  // // Real-time subscriptions for automatic updates
  // useEffect(() => {
  //   if (!user) return;

  //   console.log('Setting up real-time subscriptions for user:', user.id);

  //   // Subscribe to resume changes for the current user
  //   const resumeSubscription = supabase
  //     .channel('user-resumes')
  //     .on('postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'resumes',
  //         filter: `user_id=eq.${user.id}`
  //       },
  //       (payload) => {
  //         console.log('Resume updated:', payload);
  //         loadResumes(); // Reload user's resumes
  //       }
  //     )
  //     .subscribe();

  //   // Subscribe to any resume changes for leaderboard updates
  //   const leaderboardSubscription = supabase
  //     .channel('leaderboard-updates')
  //     .on('postgres_changes',
  //       {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'resumes',
  //         filter: 'score=not.is.null'
  //       },
  //       (payload) => {
  //         console.log('Leaderboard updated:', payload);
  //         if (activeTab === 'leaderboard') {
  //           loadLeaderboard(); // Reload leaderboard
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     console.log('Cleaning up real-time subscriptions');
  //     supabase.removeChannel(resumeSubscription);
  //     supabase.removeChannel(leaderboardSubscription);
  //   };
  // }, [user, activeTab, loadResumes, loadLeaderboard]);

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

      const { error: createError } = await ResumeService.createResume(
        user.id,
        user.display_name || user.profile?.email || user.email || '',
        fileUrl!,
        selectedFile.name,
        user.email || user.profile?.email || undefined
      );

      setUploadProgress(100);

      if (createError) {
        setError(createError);
      } else {
        setMessage('Resume uploaded successfully!');
        setSelectedFile(null);
        await loadResumes();
      }
    } catch {
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
      setError('');

      const response = await fetch(resume.file_url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = resume.file_name || `resume_${new Date(resume.created_at).toLocaleDateString().replace(/\//g, '_')}.pdf`;
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

  const handleDelete = async (resume: Resume) => {
    if (!confirm(`Are you sure you want to delete "${resume.file_name || 'this resume'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      const { error: deleteError } = await ResumeService.deleteResume(resume.id, resume.file_url);

      if (deleteError) {
        setError(deleteError);
      } else {
        setMessage('Resume deleted successfully!');
        await loadResumes();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete resume. Please try again.');
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
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Resume Dashboard</h2>
          <p className="text-gray-600">Upload your resume and track its review status</p>
        </div>

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

        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "dashboard"
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
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "leaderboard"
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
                        <div
                          key={resume.id}
                          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedResume(resume);
                            setShowViewModal(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-shrink-0">
                                <FileText className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-3 mb-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {resume.file_name || `resume_${new Date(resume.created_at).toLocaleDateString().replace(/\//g, '_')}.pdf`}
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
                                      <span className="font-medium text-black">{resume.score}/100</span>
                                    </div>
                                  )}
                                </div>
                                {resume.notes && (
                                  <p className="text-xs text-gray-600 mt-1 italic">&quot;{resume.notes}&quot;</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
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
                                <button
                                  onClick={() => handleDelete(resume)}
                                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                  title="Delete resume"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                <>
                  {user && leaderboardData.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {(() => {
                        const userIdentifier = user.display_name || user.profile?.email || user.email;
                        const userRanking = leaderboardData.find(item => item.email === userIdentifier);

                        return (
                          <>
                            <div className="flex items-center space-x-2 mb-2">
                              <Star className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Your Current Ranking
                                {userRanking && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                    #{userRanking.rank}
                                  </span>
                                )}
                              </span>
                            </div>
                            {userRanking ? (
                              <p className="text-xs text-blue-700">
                                with a score of {userRanking.score}/100.
                                {userRanking.rank === 1 ? ' Congratulations on the top spot!' : ' Keep improving to climb higher!'}
                              </p>
                            ) : (
                              <p className="text-xs text-blue-700">
                                Submit a resume and get it reviewed to appear on the leaderboard!
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="space-y-4">
                    {leaderboardData.map((candidate) => (
                      <div key={candidate.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${candidate.rank === 1 ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
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
                              <span className="font-bold text-gray-500 text-lg">{candidate.score}</span>
                              <span className="text-gray-500">/100</span>
                            </div>
                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full ${candidate.score >= 80 ? 'bg-green-500' :
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
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <ResumeViewModal
        resume={selectedResume!}
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedResume(null);
        }}
        onDownload={handleDownload}
      />
    </>
  );
}