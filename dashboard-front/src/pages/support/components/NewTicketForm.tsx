// src/pages/support/components/NewTicketForm.tsx
import { useState, useRef } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip, X, Image, FileText, AlertTriangle } from "lucide-react";
import type { TicketType, TicketPriority, CreateTicketPayload, TicketTypeConfig } from "../types";

interface AttachmentPreview {
    id: string;
    file: File;
    preview?: string; // For images
}

interface NewTicketFormProps {
    initialType?: TicketType;
    ticketTypes: TicketTypeConfig[];
    onSubmit: (payload: CreateTicketPayload, files?: File[]) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"];

export function NewTicketForm({
    initialType,
    ticketTypes,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: NewTicketFormProps) {
    const [ticketType, setTicketType] = useState<TicketType | "">(initialType ?? "");
    const [priority, setPriority] = useState<TicketPriority>("medium");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketType || !subject || !message) return;

        const files = attachments.map(a => a.file);
        await onSubmit(
            {
                type: ticketType,
                priority,
                subject,
                message,
            },
            files.length > 0 ? files : undefined
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setFileError(null);

        const newAttachments: AttachmentPreview[] = [];
        const errors: string[] = [];

        Array.from(files).forEach(file => {
            // Check max files
            if (attachments.length + newAttachments.length >= MAX_FILES) {
                errors.push(`Maximum ${MAX_FILES} files allowed`);
                return;
            }

            // Check file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: Unsupported file type`);
                return;
            }

            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: File too large (max 5MB)`);
                return;
            }

            // Create preview for images
            const attachment: AttachmentPreview = {
                id: `${Date.now()}-${Math.random()}`,
                file,
            };

            if (file.type.startsWith("image/")) {
                attachment.preview = URL.createObjectURL(file);
            }

            newAttachments.push(attachment);
        });

        if (errors.length > 0) {
            setFileError(errors.join(", "));
        }

        if (newAttachments.length > 0) {
            setAttachments(prev => [...prev, ...newAttachments]);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => {
            const attachment = prev.find(a => a.id === id);
            if (attachment?.preview) {
                URL.revokeObjectURL(attachment.preview);
            }
            return prev.filter(a => a.id !== id);
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isValid = ticketType && subject.trim() && message.trim();

    return (
        <Card className="bg-white rounded-xl shadow-md border-0">
            <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-blue-800">
                            Create New Ticket
                        </CardTitle>
                        <CardDescription>
                            Fill in the details below and our team will respond shortly
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Type */}
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                                Type
                            </Label>
                            <Select
                                value={ticketType}
                                onValueChange={(val) => setTicketType(val as TicketType)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ticketTypes.map(({ value, label, icon: Icon }) => (
                                        <SelectItem key={value} value={value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                                Priority
                            </Label>
                            <Select
                                value={priority}
                                onValueChange={(val) => setPriority(val as TicketPriority)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                                            Low
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                                            Medium
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="high">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                            High
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="critical">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-purple-500" />
                                            Critical
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                            Subject
                        </Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of your issue or request"
                            className="w-full"
                            required
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                            Message
                        </Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your issue in detail. Include any steps to reproduce if reporting a bug."
                            className="w-full min-h-[150px]"
                            required
                        />
                    </div>

                    {/* File Attachments */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                            Attachments (optional)
                        </Label>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={attachments.length >= MAX_FILES}
                                className="gap-2"
                            >
                                <Paperclip className="w-4 h-4" />
                                Add Screenshot or File
                            </Button>
                            <span className="text-xs text-gray-500">
                                {attachments.length}/{MAX_FILES} files • Max 5MB each
                            </span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ALLOWED_TYPES.join(",")}
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* File error */}
                        {fileError && (
                            <p className="text-sm text-red-500">{fileError}</p>
                        )}

                        {/* Attachment previews */}
                        {attachments.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {attachments.map(attachment => (
                                    <div
                                        key={attachment.id}
                                        className="relative group border rounded-lg overflow-hidden bg-gray-50"
                                    >
                                        {attachment.preview ? (
                                            <img
                                                src={attachment.preview}
                                                alt={attachment.file.name}
                                                className="w-full h-24 object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-24 flex flex-col items-center justify-center gap-1 p-2">
                                                {attachment.file.type === "application/pdf" ? (
                                                    <FileText className="w-8 h-8 text-red-500" />
                                                ) : (
                                                    <Image className="w-8 h-8 text-gray-400" />
                                                )}
                                                <span className="text-xs text-gray-500 truncate max-w-full px-1">
                                                    {attachment.file.name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(attachment.id)}
                                            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>

                                        {/* File size */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-0.5 text-center">
                                            {formatFileSize(attachment.file.size)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="text-xs text-gray-500">
                            Supported: PNG, JPG, GIF, WebP, PDF
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Ticket
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
