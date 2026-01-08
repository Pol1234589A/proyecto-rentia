
export interface RentgerAsset {
    id: string | number;
    name: string;
    alias?: string;
    status?: number; // 0 active, etc.
    price?: number;
    address?: string;
    description?: string;
    images?: string[];
    attributes?: any[];
}

export interface RentgerContract {
    id: string | number;
    name?: string;
    status: number;
    date_start: string;
    date_end: string;
    asset_id?: string | number;
    propertyName?: string;
    price?: number;
    users?: RentgerUser[];
}

export interface RentgerUser {
    id: string | number;
    name: string;
    email?: string;
    type: number; // 2: Tenant, 7: Lead, 1: Owner
}

export interface RentgerLead {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    asset_id?: string;
    source?: string;
}
