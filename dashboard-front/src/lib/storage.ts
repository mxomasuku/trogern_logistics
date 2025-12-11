// src/lib/storage.ts
// Firebase Storage utilities for uploading support ticket attachments

import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import type { UploadTaskSnapshot } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";

// ============================================
// TYPES
// ============================================

export interface UploadProgress {
    progress: number; // 0-100
    bytesTransferred: number;
    totalBytes: number;
    state: "running" | "paused" | "success" | "error" | "canceled";
}

export interface UploadResult {
    url: string;
    path: string;
    filename: string;
    mimeType: string;
    size: number;
}

export interface UploadOptions {
    onProgress?: (progress: UploadProgress) => void;
    maxSizeBytes?: number;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed MIME types - strict validation
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
] as const;

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// ============================================
// VALIDATION
// ============================================

export interface FileValidationError extends Error {
    code: string;
}

export function createFileValidationError(message: string, code: string): FileValidationError {
    const error = new Error(message) as FileValidationError;
    error.name = "FileValidationError";
    error.code = code;
    return error;
}

/**
 * Validate a file before upload
 * Throws FileValidationError if validation fails
 */
export function validateFile(
    file: File,
    maxSizeBytes: number = MAX_FILE_SIZE
): void {
    // Check file exists
    if (!file) {
        throw createFileValidationError("No file provided", "NO_FILE");
    }

    // Check file size
    if (file.size > maxSizeBytes) {
        const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
        throw createFileValidationError(
            `File "${file.name}" exceeds maximum size of ${maxMB}MB`,
            "FILE_TOO_LARGE"
        );
    }

    // Check file size is not zero (corrupted file)
    if (file.size === 0) {
        throw createFileValidationError(
            `File "${file.name}" is empty or corrupted`,
            "EMPTY_FILE"
        );
    }

    // Strict MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
        throw createFileValidationError(
            `File type "${file.type || "unknown"}" is not allowed. Allowed types: JPEG, PNG, GIF, WebP, PDF`,
            "INVALID_FILE_TYPE"
        );
    }

    // Additional check: verify file extension matches MIME type
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions: Record<AllowedMimeType, string[]> = {
        "image/jpeg": ["jpg", "jpeg"],
        "image/png": ["png"],
        "image/gif": ["gif"],
        "image/webp": ["webp"],
        "application/pdf": ["pdf"],
    };

    const allowedExtensions = validExtensions[file.type as AllowedMimeType];
    if (!allowedExtensions || !allowedExtensions.includes(extension || "")) {
        throw createFileValidationError(
            `File extension ".${extension}" doesn't match the file type "${file.type}"`,
            "EXTENSION_MISMATCH"
        );
    }
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Generate a unique filename to prevent collisions
 */
function generateUniqueFilename(originalFilename: string): string {
    const extension = originalFilename.split(".").pop() || "";
    const nameWithoutExt = originalFilename.slice(0, -(extension.length + 1));
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 50);
    return `${safeName}_${timestamp}_${random}.${extension}`;
}

/**
 * Upload a file to temp storage (before ticket is created)
 * Files are stored in temp-attachments/{userId}/{filename}
 */
export async function uploadTempAttachment(
    file: File,
    userId: string,
    options: UploadOptions = {}
): Promise<UploadResult> {
    const { onProgress, maxSizeBytes = MAX_FILE_SIZE } = options;

    // Validate file
    validateFile(file, maxSizeBytes);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const storagePath = `temp-attachments/${userId}/${uniqueFilename}`;

    // Create reference
    const storageRef = ref(getFirebaseStorage(), storagePath);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
            customMetadata: {
                originalFilename: file.name,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
            },
        });

        uploadTask.on(
            "state_changed",
            (snapshot: UploadTaskSnapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.({
                    progress,
                    bytesTransferred: snapshot.bytesTransferred,
                    totalBytes: snapshot.totalBytes,
                    state: snapshot.state as UploadProgress["state"],
                });
            },
            (error) => {
                console.error("Upload error:", error);
                reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
                try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        url: downloadUrl,
                        path: storagePath,
                        filename: file.name,
                        mimeType: file.type,
                        size: file.size,
                    });
                } catch (error: any) {
                    reject(new Error(`Failed to get download URL: ${error.message}`));
                }
            }
        );
    });
}

/**
 * Upload a file to a specific ticket's attachments folder
 * Files are stored in support-attachments/{companyId}/{ticketId}/{filename}
 */
export async function uploadTicketAttachment(
    file: File,
    companyId: string,
    ticketId: string,
    options: UploadOptions = {}
): Promise<UploadResult> {
    const { onProgress, maxSizeBytes = MAX_FILE_SIZE } = options;

    // Validate file
    validateFile(file, maxSizeBytes);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const storagePath = `support-attachments/${companyId}/${ticketId}/${uniqueFilename}`;

    // Create reference
    const storageRef = ref(getFirebaseStorage(), storagePath);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
            customMetadata: {
                originalFilename: file.name,
                ticketId,
                companyId,
                uploadedAt: new Date().toISOString(),
            },
        });

        uploadTask.on(
            "state_changed",
            (snapshot: UploadTaskSnapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.({
                    progress,
                    bytesTransferred: snapshot.bytesTransferred,
                    totalBytes: snapshot.totalBytes,
                    state: snapshot.state as UploadProgress["state"],
                });
            },
            (error) => {
                console.error("Upload error:", error);
                reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
                try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        url: downloadUrl,
                        path: storagePath,
                        filename: file.name,
                        mimeType: file.type,
                        size: file.size,
                    });
                } catch (error: any) {
                    reject(new Error(`Failed to get download URL: ${error.message}`));
                }
            }
        );
    });
}

/**
 * Upload multiple files with overall progress tracking
 */
export async function uploadMultipleAttachments(
    files: File[],
    userId: string,
    options: {
        onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
        onOverallProgress?: (progress: number) => void;
        onFileComplete?: (fileIndex: number, result: UploadResult) => void;
        onFileError?: (fileIndex: number, error: Error) => void;
    } = {}
): Promise<{ results: UploadResult[]; errors: { index: number; error: Error }[] }> {
    const { onFileProgress, onOverallProgress, onFileComplete, onFileError } = options;

    const results: UploadResult[] = [];
    const errors: { index: number; error: Error }[] = [];
    const fileProgresses: number[] = new Array(files.length).fill(0);

    const updateOverallProgress = () => {
        const totalProgress = fileProgresses.reduce((sum, p) => sum + p, 0) / files.length;
        onOverallProgress?.(totalProgress);
    };

    // Upload files sequentially to avoid overwhelming the network
    for (let i = 0; i < files.length; i++) {
        try {
            const result = await uploadTempAttachment(files[i], userId, {
                onProgress: (progress) => {
                    fileProgresses[i] = progress.progress;
                    onFileProgress?.(i, progress);
                    updateOverallProgress();
                },
            });
            results.push(result);
            fileProgresses[i] = 100;
            updateOverallProgress();
            onFileComplete?.(i, result);
        } catch (error: any) {
            errors.push({ index: i, error });
            fileProgresses[i] = 100; // Mark as complete even on error
            updateOverallProgress();
            onFileError?.(i, error);
        }
    }

    return { results, errors };
}

/**
 * Delete a file from storage
 */
export async function deleteAttachment(storagePath: string): Promise<void> {
    const storageRef = ref(getFirebaseStorage(), storagePath);
    await deleteObject(storageRef);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
