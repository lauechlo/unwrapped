'use client';

import { useState, useCallback } from 'react';
import { parseStreamingHistory } from '@/lib/v2/parser';

interface FileUploadState {
  status: 'idle' | 'parsing' | 'success' | 'error';
  message: string;
  fileCount: number;
  totalPlays: number;
  uniqueTracks: number;
  uniqueArtists: number;
  dateRange: string;
}

interface FileProgress {
  name: string;
  status: 'pending' | 'parsing' | 'success' | 'error';
  plays?: number;
  error?: string;
  size: string;
}

interface FileUploaderProps {
  onUploadComplete: (data: any) => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    status: 'idle',
    message: '',
    fileCount: 0,
    totalPlays: 0,
    uniqueTracks: 0,
    uniqueArtists: 0,
    dateRange: '',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle file selection (preview before processing)
  const handleFileSelection = useCallback((files: FileList) => {
    console.log('[FileUploader] handleFileSelection called with', files.length, 'files');
    const filesArray = Array.from(files);

    // Validate files
    const jsonFiles = filesArray.filter(f => f.name.endsWith('.json'));
    console.log('[FileUploader] Found', jsonFiles.length, 'JSON files');

    if (jsonFiles.length === 0) {
      console.log('[FileUploader] No JSON files found');
      setUploadState({
        status: 'error',
        message: 'Please upload JSON files only',
        fileCount: 0,
        totalPlays: 0,
        uniqueTracks: 0,
        uniqueArtists: 0,
        dateRange: '',
      });
      return;
    }

    console.log('[FileUploader] Setting selectedFiles:', jsonFiles.map(f => f.name));
    setSelectedFiles(jsonFiles);

    // Initialize progress tracking
    const progress = jsonFiles.map(f => ({
      name: f.name,
      status: 'pending' as const,
      size: formatFileSize(f.size)
    }));
    console.log('[FileUploader] Setting fileProgress:', progress);
    setFileProgress(progress);
  }, []);

  // Process files with progress tracking
  const handleFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setUploadState(prev => ({
      ...prev,
      status: 'parsing',
      message: `Processing ${selectedFiles.length} file(s)...`,
      fileCount: selectedFiles.length,
    }));

    setProcessingProgress(0);

    try {
      // Collect all parsed data
      const allPlays: any[] = [];
      let parseErrors = 0;

      // Parse each file with progress updates
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Update this file to "parsing"
        setFileProgress(prev => prev.map((fp, idx) =>
          idx === i ? { ...fp, status: 'parsing' } : fp
        ));

        try {
          const content = await file.text();
          const parseResult = await parseStreamingHistory(content, {
            sanitize: true,
            validate: false,
          });

          if (parseResult.success && parseResult.data) {
            allPlays.push(...parseResult.data);

            // Success for this file
            setFileProgress(prev => prev.map((fp, idx) =>
              idx === i ? {
                ...fp,
                status: 'success',
                plays: parseResult.data?.length || 0
              } : fp
            ));
          } else {
            parseErrors++;
            const errorMsg = parseResult.error || 'Invalid format';

            // Error for this file
            setFileProgress(prev => prev.map((fp, idx) =>
              idx === i ? {
                ...fp,
                status: 'error',
                error: errorMsg
              } : fp
            ));

            console.error(`Failed to parse ${file.name}:`, parseResult.error);
          }
        } catch (fileError) {
          parseErrors++;
          const errorMsg = fileError instanceof Error ? fileError.message : 'Parse failed';

          setFileProgress(prev => prev.map((fp, idx) =>
            idx === i ? {
              ...fp,
              status: 'error',
              error: errorMsg
            } : fp
          ));
        }

        // Update overall progress
        setProcessingProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      if (allPlays.length === 0) {
        setUploadState({
          status: 'error',
          message: 'No valid streaming history found in uploaded files',
          fileCount: selectedFiles.length,
          totalPlays: 0,
          uniqueTracks: 0,
          uniqueArtists: 0,
          dateRange: '',
        });
        return;
      }

      // Calculate stats - handle both Extended History and V1 format
      const uniqueTracks = new Set(allPlays.map(p => {
        const trackName = p.master_metadata_track_name || p.trackName || 'Unknown';
        const artistName = p.master_metadata_album_artist_name || p.artistName || 'Unknown';
        return `${trackName}|${artistName}`;
      })).size;

      const uniqueArtists = new Set(allPlays.map(p =>
        p.master_metadata_album_artist_name || p.artistName || 'Unknown'
      )).size;

      // Get date range - handle both formats
      const timestamps = allPlays
        .map(p => new Date(p.ts || p.timestamp || p.endTime))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      const firstDate = timestamps[0];
      const lastDate = timestamps[timestamps.length - 1];
      const dateRange = firstDate && lastDate
        ? `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`
        : 'Unknown date range';

      setUploadState({
        status: 'success',
        message: parseErrors > 0
          ? `Processed ${selectedFiles.length - parseErrors}/${selectedFiles.length} files successfully`
          : `Successfully processed ${selectedFiles.length} file(s)`,
        fileCount: selectedFiles.length,
        totalPlays: allPlays.length,
        uniqueTracks,
        uniqueArtists,
        dateRange,
      });

      // Pass data to parent
      onUploadComplete(allPlays);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process files',
        fileCount: selectedFiles.length,
        totalPlays: 0,
        uniqueTracks: 0,
        uniqueArtists: 0,
        dateRange: '',
      });
    }
  }, [selectedFiles, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  }, [handleFileSelection]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[FileUploader] handleFileInput triggered!');
    console.log('[FileUploader] e.target.files:', e.target.files);
    console.log('[FileUploader] files length:', e.target.files?.length);

    if (e.target.files && e.target.files.length > 0) {
      console.log('[FileUploader] Calling handleFileSelection...');
      handleFileSelection(e.target.files);
    } else {
      console.log('[FileUploader] No files selected or files is null');
    }
  }, [handleFileSelection]);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileProgress(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedFiles([]);
    setFileProgress([]);
    setProcessingProgress(0);
    setUploadState({
      status: 'idle',
      message: '',
      fileCount: 0,
      totalPlays: 0,
      uniqueTracks: 0,
      uniqueArtists: 0,
      dateRange: '',
    });
  }, []);

  // Debug: Log render state
  console.log('[FileUploader] Render - selectedFiles.length:', selectedFiles.length, 'status:', uploadState.status);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all
          ${isDragging
            ? 'border-purple-500 bg-purple-500/10'
            : uploadState.status === 'success'
            ? 'border-green-500 bg-green-500/10'
            : uploadState.status === 'error'
            ? 'border-red-500 bg-red-500/10'
            : selectedFiles.length > 0
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
          }
        `}
      >
        {uploadState.status === 'idle' && selectedFiles.length === 0 && (
          <>
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Drop Your Spotify Files Here
            </h3>
            <p className="text-gray-300 mb-6">
              or click to browse
            </p>
            <input
              type="file"
              multiple
              accept=".json"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </>
        )}

        {/* File Preview List (before processing) */}
        {selectedFiles.length > 0 && uploadState.status === 'idle' && (
          <>
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} Selected
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
              {fileProgress.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-300">{file.size}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleFiles}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
            >
              Process Files →
            </button>
            <button
              onClick={handleReset}
              className="ml-3 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
            >
              Clear
            </button>
          </>
        )}

        {uploadState.status === 'parsing' && (
          <>
            <div className="text-6xl mb-4 animate-pulse">⚙️</div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Processing Files...
            </h3>

            {/* Overall Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Progress</span>
                <span>{processingProgress}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>

            {/* Per-File Progress */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {fileProgress.map((file, idx) => (
                <div
                  key={idx}
                  className={`
                    flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg text-left
                    ${file.status === 'parsing' ? 'border border-blue-500/50' : ''}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                      {file.status === 'pending' && <span className="text-gray-500">⏸</span>}
                      {file.status === 'parsing' && <span className="text-blue-400 animate-spin">⚙️</span>}
                      {file.status === 'success' && <span className="text-green-400">✓</span>}
                      {file.status === 'error' && <span className="text-red-400">✗</span>}
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-300">
                      {file.status === 'success' && file.plays && `${file.plays.toLocaleString()} plays`}
                      {file.status === 'error' && file.error && (
                        <span className="text-red-400">{file.error}</span>
                      )}
                      {file.status === 'parsing' && 'Parsing...'}
                      {file.status === 'pending' && 'Waiting...'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{file.size}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {uploadState.status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-400 mb-4">
              Files Loaded Successfully!
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left mb-6">
              <div className="bg-zinc-800/50 p-4 rounded-lg">
                <div className="text-sm text-gray-300">Total Plays</div>
                <div className="text-2xl font-bold text-white">
                  {uploadState.totalPlays.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-lg">
                <div className="text-sm text-gray-300">Unique Tracks</div>
                <div className="text-2xl font-bold text-white">
                  {uploadState.uniqueTracks.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-lg">
                <div className="text-sm text-gray-300">Artists</div>
                <div className="text-2xl font-bold text-white">
                  {uploadState.uniqueArtists.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-lg">
                <div className="text-sm text-gray-300">Files Processed</div>
                <div className="text-2xl font-bold text-white">
                  {fileProgress.filter(f => f.status === 'success').length}/{uploadState.fileCount}
                </div>
              </div>
            </div>

            {/* File Results */}
            {fileProgress.some(f => f.status === 'error') && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-yellow-400 hover:text-yellow-300">
                  ⚠️ Some files had errors (click to view)
                </summary>
                <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                  {fileProgress.filter(f => f.status === 'error').map((file, idx) => (
                    <div
                      key={idx}
                      className="bg-red-500/10 border border-red-500/30 p-2 rounded text-left"
                    >
                      <div className="text-sm font-medium text-white">{file.name}</div>
                      <div className="text-xs text-red-400">{file.error}</div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="mb-4 text-sm text-gray-300">
              Date range: {uploadState.dateRange}
            </div>

            <p className="text-xs text-gray-500">
              Ready to analyze! Click "Analyze My Listening History" below.
            </p>
          </>
        )}

        {uploadState.status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-bold text-red-400 mb-2">
              Upload Failed
            </h3>
            <p className="text-gray-300 mb-4">
              {uploadState.message}
            </p>

            {/* Show which files failed if available */}
            {fileProgress.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto space-y-2">
                {fileProgress.map((file, idx) => (
                  <div
                    key={idx}
                    className={`
                      bg-zinc-800/50 p-2 rounded text-left text-sm
                      ${file.status === 'error' ? 'border border-red-500/30' : ''}
                    `}
                  >
                    <div className="font-medium text-white flex items-center gap-2">
                      {file.status === 'error' ? '✗' : '•'} {file.name}
                    </div>
                    {file.error && (
                      <div className="text-xs text-red-400 mt-1">{file.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleReset}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>

      {/* File Format Help */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h4 className="text-lg font-bold text-blue-400 mb-2">
          📋 Expected File Format
        </h4>
        <p className="text-sm text-gray-300 mb-3">
          Upload your <span className="font-mono text-blue-300">Streaming_History_Audio_*.json</span> files from your Spotify privacy export.
        </p>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• You can upload multiple files at once</li>
          <li>• Files must be from <strong>Extended Streaming History</strong> (not Basic API data)</li>
          <li>• Request your data at <a href="https://www.spotify.com/account/privacy/" target="_blank" className="text-blue-400 hover:underline">spotify.com/account/privacy</a></li>
          <li>• Usually takes 30 days to receive from Spotify</li>
        </ul>
      </div>
    </div>
  );
}
