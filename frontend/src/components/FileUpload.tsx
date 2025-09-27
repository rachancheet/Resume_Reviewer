'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { validatePDFFile, formatFileSize } from '@/lib/supabase'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  selectedFile: File | null
  uploading?: boolean
  uploadProgress?: number
  error?: string
}

export default function FileUpload({ 
  onFileSelect, 
  onFileRemove, 
  selectedFile, 
  uploading = false,
  uploadProgress = 0,
  error 
}: FileUploadProps) {
  const [dragError, setDragError] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setDragError('')
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setDragError('File is too large. Maximum size is 10MB.')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setDragError('Only PDF files are allowed.')
      } else {
        setDragError('Invalid file. Please try again.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const validation = validatePDFFile(file)
      
      if (!validation.isValid) {
        setDragError(validation.error || 'Invalid file')
        return
      }

      onFileSelect(file)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, 
    multiple: false,
    disabled: uploading
  })

  const displayError = error || dragError

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50' : ''}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragActive && !isDragReject ? 'bg-blue-100' :
              isDragReject ? 'bg-red-100' :
              'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${
                isDragActive && !isDragReject ? 'text-blue-600' :
                isDragReject ? 'text-red-600' :
                'text-gray-500'
              }`} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? (
                  isDragReject ? 'Invalid file type' : 'Drop your resume here'
                ) : (
                  <>
                    Drop your resume here, or{' '}
                    <span className="text-blue-600 hover:text-blue-700">browse</span>
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500">
                PDF files only, up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`border rounded-xl p-6 ${
          uploading ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${
              uploading ? 'bg-blue-100' : 'bg-white'
            }`}>
              <FileText className={`w-6 h-6 ${
                uploading ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                
                {!uploading && (
                  <button
                    onClick={onFileRemove}
                    className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {uploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {displayError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}
    </div>
  )
}

