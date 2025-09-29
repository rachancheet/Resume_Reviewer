'use client'

import React, { useState, useEffect } from 'react'
import { X, Star, FileText, Calendar, User } from 'lucide-react'
import type { Resume } from '@/lib/supabase'

interface ReviewModalProps {
  resume: Resume
  isOpen: boolean
  onClose: () => void
  onSubmit: (resumeId: string, status: Resume['status'], score?: number, notes?: string) => void
}

export default function ReviewModal({ resume, isOpen, onClose, onSubmit }: ReviewModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Resume['status'] | ''>('')
  const [score, setScore] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with current resume data when modal opens
  useEffect(() => {
    if (isOpen && resume) {
      setSelectedStatus(resume.status || '')
      setScore(resume.score?.toString() || '')
      setNotes(resume.notes || '')
    }
  }, [isOpen, resume])

  if (!isOpen || !resume) return null

  const handleSubmit = async () => {
    if (!selectedStatus) return

    const scoreNumber = score ? parseInt(score, 10) : undefined
    if (scoreNumber !== undefined && (scoreNumber < 0 || scoreNumber > 100)) {
      alert('Score must be between 0 and 100')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(resume.id, selectedStatus, scoreNumber, notes)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedStatus('')
    setScore('')
    setNotes('')
    onClose()
  }

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
              <h3 className="text-lg font-semibold text-gray-900">Review Resume</h3>
              <p className="text-sm text-gray-500">Evaluate candidate submission</p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Candidate</p>
                    <p className="text-sm font-medium text-gray-900">{resume.user_name}</p>
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
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    resume.status === 'approved' ? 'bg-green-100 text-green-800' :
                    resume.status === 'needs_revision' ? 'bg-yellow-100 text-yellow-800' :
                    resume.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {resume.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {resume.score && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Score</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{resume.score}/100</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {resume.file_name && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">File</p>
                <p className="text-sm text-gray-900">{resume.file_name}</p>
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t border-blue-200">
              <button
                onClick={() => window.open(resume.file_url, '_blank')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Resume
              </button>
            </div>
          </div>

          {resume.notes && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-2">Previous Review Notes</p>
              <p className="text-sm text-amber-900 italic">&quot;{resume.notes}&quot;</p>
            </div>
          )}

          {/* Review Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Review Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('approved')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedStatus === 'approved'
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">Approved</div>
                    <div className="text-xs text-gray-600 mt-1">Meets requirements</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStatus('needs_revision')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedStatus === 'needs_revision'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-900'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">Needs Revision</div>
                    <div className="text-xs text-gray-600 mt-1">Minor improvements</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedStatus('rejected')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedStatus === 'rejected'
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">Rejected</div>
                    <div className="text-xs text-gray-600 mt-1">Does not meet criteria</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Score (0-100)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Enter score"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex items-center space-x-1 text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">/100</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter a score between 0 and 100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Review Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide detailed feedback for the candidate..."
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Your feedback will help the candidate improve</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedStatus || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
