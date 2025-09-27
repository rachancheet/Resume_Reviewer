'use client'

import React, { useState } from 'react'
import { X, Star } from 'lucide-react'
import type { Resume, User } from '@/lib/supabase'

interface ReviewModalProps {
  resume: Resume & { user?: User }
  isOpen: boolean
  onClose: () => void
  onSubmit: (resumeId: string, status: Resume['status'], score?: number, notes?: string) => void
}

export default function ReviewModal({ resume, isOpen, onClose, onSubmit }: ReviewModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Resume['status'] | ''>('')
  const [score, setScore] = useState<number>(75)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !resume) return null

  const handleSubmit = async () => {
    if (!selectedStatus) return

    setIsSubmitting(true)
    try {
      await onSubmit(resume.id, selectedStatus, score, notes)
      onClose()
      setSelectedStatus('')
      setScore(75)
      setNotes('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAction = async (status: Resume['status'], quickScore: number, quickNotes: string) => {
    setIsSubmitting(true)
    try {
      await onSubmit(resume.id, status, quickScore, quickNotes)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Review Resume</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Candidate:</span>{' '}
              <span className="text-gray-900">{resume.user?.email}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Uploaded:</span>{' '}
              <span className="text-gray-900">{new Date(resume.created_at).toLocaleDateString()}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Current Status:</span>{' '}
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                resume.status === 'approved' ? 'bg-green-100 text-green-800' :
                resume.status === 'needs_revision' ? 'bg-yellow-100 text-yellow-800' :
                resume.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {resume.status.replace('_', ' ').toUpperCase()}
              </span>
            </p>
            {resume.score && (
              <p className="text-sm">
                <span className="font-medium text-gray-700">Current Score:</span>{' '}
                <span className="text-gray-900">{resume.score}/100</span>
              </p>
            )}
            {resume.notes && (
              <p className="text-sm">
                <span className="font-medium text-gray-700">Previous Notes:</span>{' '}
                <span className="text-gray-900 italic">&quot;{resume.notes}&quot;</span>
              </p>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => window.open(resume.file_url, '_blank')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Resume →
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleQuickAction('approved', 85, 'Approved - meets requirements')}
              disabled={isSubmitting}
              className="p-3 text-left bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-green-800">Approve (Score: 85)</div>
              <div className="text-sm text-green-700">Meets all requirements</div>
            </button>
            
            <button
              onClick={() => handleQuickAction('needs_revision', 65, 'Needs revision - minor improvements needed')}
              disabled={isSubmitting}
              className="p-3 text-left bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-yellow-800">Needs Revision (Score: 65)</div>
              <div className="text-sm text-yellow-700">Minor improvements needed</div>
            </button>
            
            <button
              onClick={() => handleQuickAction('rejected', 35, 'Rejected - does not meet requirements')}
              disabled={isSubmitting}
              className="p-3 text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-red-800">Reject (Score: 35)</div>
              <div className="text-sm text-red-700">Does not meet requirements</div>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Custom Review</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as Resume['status'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select status...</option>
              <option value="approved">Approved</option>
              <option value="needs_revision">Needs Revision</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score: {score}/100
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900 w-8">{score}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your review notes..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedStatus || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
