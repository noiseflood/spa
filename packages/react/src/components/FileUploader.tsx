/**
 * FileUploader Component - Upload SPA files or load from URL
 */

import React, { useCallback, useState, useRef } from 'react';

export interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onURLSubmit: (url: string) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onURLSubmit,
  isDragging,
  setIsDragging,
  className = '',
}) => {
  const [url, setUrl] = useState('');
  const [showURLInput, setShowURLInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.spa')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [setIsDragging]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    },
    [setIsDragging]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.spa')) {
        onFileSelect(file);
      }
    },
    [onFileSelect, setIsDragging]
  );

  const handleURLSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (url) {
        onURLSubmit(url);
        setUrl('');
        setShowURLInput(false);
      }
    },
    [url, onURLSubmit]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`spa-uploader ${className}`}>
      <div
        className={`spa-uploader-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".spa"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <svg className="spa-uploader-icon" viewBox="0 0 24 24" width="48" height="48">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
        </svg>

        <div className="spa-uploader-text">
          <p>Drag & Drop SPA file here</p>
          <p className="spa-uploader-subtext">or</p>
        </div>

        <div className="spa-uploader-buttons">
          <button className="spa-uploader-browse" onClick={handleBrowseClick}>
            Browse Files
          </button>

          <button className="spa-uploader-url" onClick={() => setShowURLInput(!showURLInput)}>
            Load from URL
          </button>
        </div>
      </div>

      {showURLInput && (
        <form className="spa-uploader-url-form" onSubmit={handleURLSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter SPA file URL..."
            className="spa-uploader-url-input"
            autoFocus
          />
          <button type="submit" className="spa-uploader-url-submit" disabled={!url}>
            Load
          </button>
          <button
            type="button"
            className="spa-uploader-url-cancel"
            onClick={() => {
              setShowURLInput(false);
              setUrl('');
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default FileUploader;
