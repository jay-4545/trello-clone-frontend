export interface ParsedAttachment {
    url: string;
    name: string;
    mimeType?: string;
    isImage: boolean;
    isPdf: boolean;
}

export function parseAttachment(raw: string): ParsedAttachment {
    if (raw.startsWith("{")) {
        try {
            const data = JSON.parse(raw) as { u?: string; url?: string; n?: string; name?: string; t?: string };
            const url = data.u ?? data.url ?? "";
            const name = data.n ?? data.name ?? "Attachment";
            const mimeType = data.t;
            return {
                url,
                name,
                mimeType,
                isImage: isImageAttachment(url, name, mimeType),
                isPdf: isPdfAttachment(url, name, mimeType),
            };
        } catch {
            // fall through
        }
    }

    const hashIdx = raw.lastIndexOf("#");
    if (hashIdx === -1) {
        return {
            url: raw,
            name: "Attachment",
            isImage: isImageAttachment(raw),
            isPdf: isPdfAttachment(raw),
        };
    }

    const url = raw.slice(0, hashIdx);
    const name = decodeURIComponent(raw.slice(hashIdx + 1));
    return {
        url,
        name,
        isImage: isImageAttachment(url, name),
        isPdf: isPdfAttachment(url, name),
    };
}

function isImageAttachment(url: string, name?: string, mimeType?: string): boolean {
    if (mimeType?.startsWith("image/")) return true;
    return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url) || /\.(jpe?g|png|gif|webp)$/i.test(name ?? "");
}

function isPdfAttachment(url: string, name?: string, mimeType?: string): boolean {
    if (mimeType === "application/pdf") return true;
    return /\.pdf(\?|$)/i.test(url) || /\.pdf$/i.test(name ?? "");
}

export function getAttachmentOpenUrl(parsed: ParsedAttachment): string {
    if (parsed.isPdf && parsed.url.includes("res.cloudinary.com")) {
        return parsed.url.replace("/upload/", "/upload/fl_inline/");
    }
    return parsed.url;
}

export function serializeAttachment(url: string, name: string, mimeType?: string): string {
    return JSON.stringify({ u: url, n: name, t: mimeType });
}
