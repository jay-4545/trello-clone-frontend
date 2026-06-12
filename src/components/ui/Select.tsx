"use client";
import {
    useState,
    useRef,
    useEffect,
    useId,
    useCallback,
    useMemo,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X, Check, Search } from "lucide-react";
import { cn } from "@/utils/cn";

export interface SelectOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

type SelectSize = "sm" | "md";

interface BaseSelectProps {
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    error?: string;
    hint?: string;
    disabled?: boolean;
    size?: SelectSize;
    className?: string;
    triggerClassName?: string;
    searchable?: boolean;
    clearable?: boolean;
    emptyMessage?: string;
    id?: string;
    name?: string;
}

export interface SingleSelectProps extends BaseSelectProps {
    mode?: "single";
    value: string;
    onChange: (value: string) => void;
}

export interface MultiSelectProps extends BaseSelectProps {
    mode: "multiple";
    value: string[];
    onChange: (value: string[]) => void;
    maxTags?: number;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

const sizeStyles: Record<SelectSize, string> = {
    sm: "text-xs px-2 py-1 min-h-[30px]",
    md: "text-sm px-3 py-2.5 min-h-[42px]",
};

function useDropdownPosition(open: boolean, triggerRef: React.RefObject<HTMLElement | null>) {
    const [style, setStyle] = useState<React.CSSProperties>({});

    const update = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < 220 && rect.top > spaceBelow;

        setStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            zIndex: 9999,
            ...(openUp
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    }, [triggerRef]);

    useEffect(() => {
        if (!open) return;
        update();
        window.addEventListener("resize", update);
        window.addEventListener("scroll", update, true);
        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update, true);
        };
    }, [open, update]);

    return style;
}

export default function Select(props: SelectProps) {
    const {
        options,
        label,
        placeholder = "Select…",
        error,
        hint,
        disabled = false,
        size = "md",
        className,
        triggerClassName,
        searchable = false,
        clearable = false,
        emptyMessage = "No options found",
        id: externalId,
        name,
    } = props;

    const isMultiple = props.mode === "multiple";
    const generatedId = useId();
    const selectId = externalId ?? generatedId;
    const listboxId = `${selectId}-listbox`;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlightIndex, setHighlightIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownStyle = useDropdownPosition(open, triggerRef);

    const currentValue = props.value;

    const selectedSet = useMemo(() => {
        if (isMultiple) return new Set(currentValue as string[]);
        const v = currentValue as string;
        return new Set(v ? [v] : []);
    }, [isMultiple, currentValue]);

    const optionMap = useMemo(
        () => new Map(options.map((o) => [o.value, o])),
        [options]
    );

    const filteredOptions = useMemo(() => {
        if (!query.trim()) return options;
        const q = query.toLowerCase();
        return options.filter(
            (o) =>
                o.label.toLowerCase().includes(q) ||
                o.description?.toLowerCase().includes(q)
        );
    }, [options, query]);

    const displayLabel = useMemo(() => {
        if (isMultiple) {
            return (currentValue as string[])
                .map((v) => optionMap.get(v)?.label)
                .filter(Boolean) as string[];
        }
        const v = currentValue as string;
        if (optionMap.has(v)) return optionMap.get(v)!.label;
        return v || null;
    }, [isMultiple, currentValue, optionMap]);

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
        setHighlightIndex(0);
    }, []);

    const selectSingle = (value: string) => {
        if (!isMultiple) {
            (props as SingleSelectProps).onChange(value);
            close();
        }
    };

    const toggleMultiple = (value: string) => {
        if (!isMultiple) return;
        const current = props.value;
        const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        props.onChange(next);
    };

    const clearValue = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isMultiple) {
            props.onChange([]);
        } else {
            (props as SingleSelectProps).onChange("");
        }
    };

    const removeTag = (e: React.MouseEvent, value: string) => {
        e.stopPropagation();
        if (!isMultiple) return;
        props.onChange(props.value.filter((v) => v !== value));
    };

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                containerRef.current?.contains(target) ||
                document.getElementById(listboxId)?.contains(target)
            ) {
                return;
            }
            close();
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open, close, listboxId]);

    useEffect(() => {
        if (!open) return;
        setHighlightIndex(0);
    }, [query, open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!open) {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }

        if (e.key === "Escape") {
            e.preventDefault();
            close();
            triggerRef.current?.focus();
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
            return;
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
            return;
        }

        if (e.key === "Enter" && filteredOptions[highlightIndex]) {
            e.preventDefault();
            const opt = filteredOptions[highlightIndex];
            if (opt.disabled) return;
            if (isMultiple) toggleMultiple(opt.value);
            else selectSingle(opt.value);
        }
    };

    const hasValue = isMultiple
        ? props.value.length > 0
        : (props.value !== "" && props.value != null);
    const maxTags = isMultiple ? (props.maxTags ?? 2) : 0;

    const dropdown = open && typeof document !== "undefined"
        ? createPortal(
            <div
                id={listboxId}
                role="listbox"
                aria-multiselectable={isMultiple}
                style={dropdownStyle}
                className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
            >
                {searchable && (
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search…"
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                <ul className="max-h-56 overflow-y-auto py-1">
                    {filteredOptions.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-slate-400 text-center">
                            {emptyMessage}
                        </li>
                    ) : (
                        filteredOptions.map((opt, index) => {
                            const selected = selectedSet.has(opt.value);
                            const highlighted = index === highlightIndex;
                            return (
                                <li key={opt.value} role="presentation">
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        disabled={opt.disabled}
                                        onMouseEnter={() => setHighlightIndex(index)}
                                        onClick={() => {
                                            if (opt.disabled) return;
                                            if (isMultiple) toggleMultiple(opt.value);
                                            else selectSingle(opt.value);
                                        }}
                                        className={cn(
                                            "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
                                            opt.disabled && "opacity-50 cursor-not-allowed",
                                            highlighted && "bg-slate-50",
                                            selected && !isMultiple && "bg-blue-50"
                                        )}
                                    >
                                        {isMultiple && (
                                            <span
                                                className={cn(
                                                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                                    selected
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "border-slate-300 bg-white"
                                                )}
                                            >
                                                {selected && <Check className="h-3 w-3" />}
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <span className={cn(
                                                "block truncate",
                                                size === "sm" ? "text-xs" : "text-sm",
                                                selected && !isMultiple ? "text-blue-700 font-medium" : "text-slate-800"
                                            )}>
                                                {opt.label}
                                            </span>
                                            {opt.description && (
                                                <span className="block text-xs text-slate-500 truncate mt-0.5">
                                                    {opt.description}
                                                </span>
                                            )}
                                        </span>
                                        {!isMultiple && selected && (
                                            <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                        )}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>,
            document.body
        )
        : null;

    return (
        <div ref={containerRef} className={cn("flex flex-col gap-1.5 w-full", className)}>
            {label && (
                <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}

            <button
                ref={triggerRef}
                id={selectId}
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                onClick={() => !disabled && setOpen((v) => !v)}
                onKeyDown={handleKeyDown}
                className={cn(
                    "w-full flex items-center gap-2 rounded-lg border bg-white text-left transition-colors duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
                    error
                        ? "border-red-400 focus:ring-red-500"
                        : "border-slate-300 hover:border-slate-400",
                    sizeStyles[size],
                    triggerClassName
                )}
            >
                <span className="flex-1 min-w-0 flex items-center gap-1 flex-wrap">
                    {isMultiple && Array.isArray(displayLabel) && displayLabel.length > 0 ? (
                        <>
                            {props.value.slice(0, maxTags).map((v) => {
                                const opt = optionMap.get(v);
                                return (
                                    <span
                                        key={v}
                                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-1.5 py-0.5 rounded"
                                    >
                                        {opt?.label ?? v}
                                        {!disabled && (
                                            <span
                                                role="button"
                                                tabIndex={-1}
                                                onClick={(e) => removeTag(e, v)}
                                                className="hover:text-blue-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </span>
                                        )}
                                    </span>
                                );
                            })}
                            {props.value.length > maxTags && (
                                <span className="text-xs text-slate-500">
                                    +{props.value.length - maxTags} more
                                </span>
                            )}
                        </>
                    ) : !isMultiple && displayLabel ? (
                        <span className="truncate text-slate-900">{displayLabel as string}</span>
                    ) : (
                        <span className="truncate text-slate-400">{placeholder}</span>
                    )}
                </span>

                <span className="flex items-center gap-1 shrink-0 text-slate-400">
                    {clearable && hasValue && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={clearValue}
                            className="hover:text-slate-600 p-0.5"
                            aria-label="Clear selection"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 transition-transform",
                            open && "rotate-180"
                        )}
                    />
                </span>
            </button>

            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={isMultiple ? props.value.join(",") : props.value}
                    readOnly
                />
            )}

            {error && (
                <p className="text-xs text-red-500" role="alert">
                    {error}
                </p>
            )}
            {!error && hint && (
                <p className="text-xs text-slate-500">{hint}</p>
            )}

            {dropdown}
        </div>
    );
}
