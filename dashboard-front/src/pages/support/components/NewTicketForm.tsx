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
import { Send, Paperclip, X, Image, FileText, AlertTriangle, Loader2 } from "lucide-react";
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

/* ---- Consistent styling with app forms ---- */
const inputClasses = [
    "h-10 rounded-lg",
    "border-0 bg-blue-50/60",
    "text-blue-950 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
].join(" ");

const textareaClasses = [
    "rounded-lg",
    "border-0 bg-blue-50/60",
    "text-blue-950 placeholder:text-blue-300",
    "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-0",
    "min-h-[150px] resize-none",
].join(" ");

const selectTriggerClasses = [
    "h-10 rounded-lg",
    "border-0 bg-blue-50/60",
    "text-blue-950",
    "focus:ring-2 focus:ring-sky-400 focus:ring-offset-0",
].join(" ");

const labelClasses = "text-sm text-blue-900/80";

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
        <Card className="border-0 shadow-none bg-white rounded-2xl ring-1 ring-black/5">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-semibold text-blue-700">
                            Create New Ticket
                        </CardTitle>
                        <CardDescription className="text-sm text-blue-900/60 mt-1">
                            Fill in the details below and our team will respond shortly
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Ticket Details Section */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-blue-900/90">Ticket Details</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Type */}
                            <div className="space-y-1">
                                <Label htmlFor="type" className={labelClasses}>
                                    Type <span className="text-red-600">*</span>
                                </Label>
                                <Select
                                    value={ticketType}
                                    onValueChange={(val) => setTicketType(val as TicketType)}
                                >
                                    <SelectTrigger className={selectTriggerClasses}>
                                        <SelectValue placeholder="Select type…" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-0 ring-1 ring-black/10 shadow-lg rounded-lg">
                                        {ticketTypes.map(({ value, label, icon: Icon }) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                                className="focus:bg-blue-50 rounded-md"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-blue-600" />
                                                    <span>{label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Priority */}
                            <div className="space-y-1">
                                <Label htmlFor="priority" className={labelClasses}>
                                    Priority <span className="text-red-600">*</span>
                                </Label>
                                <Select
                                    value={priority}
                                    onValueChange={(val) => setPriority(val as TicketPriority)}
                                >
                                    <SelectTrigger className={selectTriggerClasses}>
                                        <SelectValue placeholder="Select priority…" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-0 ring-1 ring-black/10 shadow-lg rounded-lg">
                                        <SelectItem value="low" className="focus:bg-blue-50 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                <span>Low</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium" className="focus:bg-blue-50 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                <span>Medium</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high" className="focus:bg-blue-50 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                                <span>High</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="critical" className="focus:bg-blue-50 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-purple-500" />
                                                <span>Critical</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-blue-900/90">Description</h3>

                        {/* Subject */}
                        <div className="space-y-1">
                            <Label htmlFor="subject" className={labelClasses}>
                                Subject <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief summary of your issue or request"
                                className={inputClasses}
                                required
                            />
                        </div>

                        {/* Message */}
                        <div className="space-y-1">
                            <Label htmlFor="message" className={labelClasses}>
                                Message <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your issue in detail. Include any steps to reproduce if reporting a bug."
                                className={textareaClasses}
                                required
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-blue-900/90">Attachments</h3>

                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={attachments.length >= MAX_FILES}
                                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg"
                            >
                                <Paperclip className="w-4 h-4" />
                                Add Screenshot or File
                            </Button>
                            <span className="text-xs text-blue-900/60">
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
                                        className="relative group rounded-lg overflow-hidden bg-blue-50/60 ring-1 ring-black/5"
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
                                                    <Image className="w-8 h-8 text-blue-400" />
                                                )}
                                                <span className="text-xs text-blue-900/60 truncate max-w-full px-1">
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

                        <p className="text-xs text-blue-900/50">
                            Supported formats: PNG, JPG, GIF, WebP, PDF
                        </p>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            className="bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                                     hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600
                                     text-white shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting…
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

