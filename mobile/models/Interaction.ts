export type InteractionAction = {
    id?: string;
    type?: string;
    namespace: string;
    target?: string;
    params: Record<string, unknown>;
    tags?: Record<string, string>;
};

export type InteractionRule = {
    id?: string;
    conditionEvaluationDelay?: number;
    triggers?: unknown[];
    constraints?: unknown[];
    actions?: InteractionAction[];
    tags?: Record<string, string>;
};

export type Interaction = {
    created: string;
    freezeTime?: number;
    id: string;
    modified: string;
    name?: string;
    rules: InteractionRule[];
    tags?: Record<string, string>;
    validFrom?: string;
    validTo?: string;
    isInternal?: boolean;
    [key: string]: unknown;
};
