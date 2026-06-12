import Badge from "@/components/ui/Badge";
import {
    type WorkspaceRole,
    type BoardRole,
    type SystemRole,
    WORKSPACE_ROLE_LABELS,
    BOARD_ROLE_LABELS,
    SYSTEM_ROLE_LABELS,
    WORKSPACE_ROLE_VARIANT,
    BOARD_ROLE_VARIANT,
    SYSTEM_ROLE_VARIANT,
} from "@/types/role.types";

type RoleBadgeProps = {
    role: WorkspaceRole | BoardRole | SystemRole | string;
    scope?: "workspace" | "board" | "system";
    className?: string;
    dot?: boolean;
};

function getLabel(role: string, scope: RoleBadgeProps["scope"]): string {
    if (scope === "board" && role in BOARD_ROLE_LABELS) return BOARD_ROLE_LABELS[role as BoardRole];
    if (scope === "system" && role in SYSTEM_ROLE_LABELS) return SYSTEM_ROLE_LABELS[role as SystemRole];
    if (role in WORKSPACE_ROLE_LABELS) return WORKSPACE_ROLE_LABELS[role as WorkspaceRole];
    return role.charAt(0).toUpperCase() + role.slice(1);
}

function getVariant(role: string, scope: RoleBadgeProps["scope"]) {
    if (scope === "board" && role in BOARD_ROLE_VARIANT) return BOARD_ROLE_VARIANT[role as BoardRole];
    if (scope === "system" && role in SYSTEM_ROLE_VARIANT) return SYSTEM_ROLE_VARIANT[role as SystemRole];
    if (role in WORKSPACE_ROLE_VARIANT) return WORKSPACE_ROLE_VARIANT[role as WorkspaceRole];
    return "default" as const;
}

export default function RoleBadge({ role, scope = "workspace", className, dot }: RoleBadgeProps) {
    return (
        <Badge variant={getVariant(role, scope)} className={className} dot={dot}>
            {getLabel(role, scope)}
        </Badge>
    );
}
