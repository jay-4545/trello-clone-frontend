import { cn } from "@/utils/cn";

export function getWorkspaceColor(workspaceId: number): string {
    return `hsl(${(workspaceId * 47) % 360}, 65%, 50%)`;
}

export function getWorkspaceColorLight(workspaceId: number): string {
    return `hsl(${(workspaceId * 47) % 360}, 55%, 96%)`;
}

export function getWorkspaceColorMuted(workspaceId: number): string {
    return `hsl(${(workspaceId * 47) % 360}, 45%, 88%)`;
}
