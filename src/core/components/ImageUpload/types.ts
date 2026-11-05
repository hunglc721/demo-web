import React from 'react';

export interface UploadedImage {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  base64?: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export interface ImageUploadProps {
  value?: string | string[] | UploadedImage | UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  onRemove?: (removed: UploadedImage, remaining: UploadedImage[]) => void;
  onError?: (errorMessage: string) => void;

  multiple?: boolean;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  simulateProgress?: boolean;
  simulationDurationMs?: number;

  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  dropzoneText?: string;
  className?: string;
}
