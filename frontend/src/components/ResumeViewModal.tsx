'use client'

import React from 'react'
import { X, Star, FileText, Calendar, User, Download, Eye } from 'lucide-react'
import type { Resume } from '@/lib/supabase'

interface ResumeViewModalProps {
  resume: Resume
  isOpen: boolean
  onClose: () => void
  onDownload: (resume: Resume) => void
}

export default function ResumeViewModal({ resume, isOpen, onClose, onDownload }: ResumeViewModalProps) {
  if (!isOpen || !resume) return null

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resume Details</h3>
              <p className="text-sm text-gray-500">View your submission information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Resume Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {resume.file_name || `resume_${new Date(resume.created_at).toLocaleDateString().replace(/\//g, '_')}.pdf`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</p>
                    <p className="text-sm text-gray-900">{new Date(resume.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                  <span className={getStatusBadge(resume.status)}>
                    {resume.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {resume.score && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Score</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{resume.score}/100</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {resume.updated_at !== resume.created_at && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(resume.updated_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Review Notes */}
          {resume.notes && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">Review Feedback</p>
              <p className="text-sm text-amber-900">&quot;{resume.notes}&quot;</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.open(resume.file_url, '_blank')}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Resume
            </button>
            
            <button
              onClick={() => onDownload(resume)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}