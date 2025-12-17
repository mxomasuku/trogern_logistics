// src/pages/trips/components/FormComponents.tsx
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const labelCls = "text-xs font-medium text-blue-700";
const baseInputClasses = () =>
    "w-full rounded-md border-0 bg-blue-50 text-blue-900 placeholder:text-blue-300 focus-visible:ring-2 focus-visible:ring-sky-400";

export function Grid({
    children,
    one,
    two,
    three,
}: {
    children: ReactNode;
    one?: boolean;
    two?: boolean;
    three?: boolean;
}) {
    const cols = three ? "md:grid-cols-3" : two ? "md:grid-cols-2" : one ? "md:grid-cols-1" : "md:grid-cols-2";
    return <div className={`grid grid-cols-1 ${cols} gap-4`}>{children}</div>;
}

export function TextField({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div>
            <Label className={labelCls}>
                {label}
                {required && <span className="text-red-600"> *</span>}
            </Label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`${baseInputClasses()} mt-1`}
            />
        </div>
    );
}

export function NumberField({
    label,
    value,
    onChange,
    min,
    max,
    step,
    required,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
}) {
    return (
        <div>
            <Label className={labelCls}>
                {label}
                {required && <span className="text-red-600"> *</span>}
            </Label>
            <Input
                type="number"
                value={String(value)}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className={`${baseInputClasses()} mt-1`}
            />
        </div>
    );
}

export function TextArea({
    label,
    value,
    onChange,
    placeholder,
    rows,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    required?: boolean;
}) {
    return (
        <div>
            <Label className={labelCls}>
                {label}
                {required && <span className="text-red-600"> *</span>}
            </Label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows || 3}
                className={`${baseInputClasses()} mt-1 resize-none py-2 px-3`}
            />
        </div>
    );
}
