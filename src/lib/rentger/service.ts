
import axios from 'axios';
import { RentgerAsset, RentgerContract, RentgerLead } from './types';

const RENTGER_API_KEY = process.env.RENTGER_API_KEY || process.env.NEXT_PUBLIC_RENTGER_API_KEY;
const BASE_URL = 'https://api.rentger.com';

let authToken: string | null = null;
let tokenExpiration: number = 0;

// Simple in-memory cache for properties
let assetsCache: RentgerAsset[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

export const RentgerBackendService = {

    /**
     * Authenticate and get session token
     */
    async authenticate(): Promise<string | null> {
        if (!RENTGER_API_KEY) {
            console.error('RENTGER_API_KEY is not defined in environment variables.');
            return null;
        }

        if (authToken && Date.now() < tokenExpiration) return authToken;

        try {
            const encodedKey = encodeURIComponent(RENTGER_API_KEY.trim());
            const response = await axios.get(`${BASE_URL}/token/${encodedKey}`, {
                headers: commonHeaders
            });

            const token = typeof response.data === 'string' ? response.data : response.data.token || response.data.access_token;

            if (token) {
                authToken = token;
                tokenExpiration = Date.now() + (23 * 60 * 60 * 1000); // 23h (Rentger tokens usually 24h)
                return authToken;
            }
            return null;
        } catch (error: any) {
            console.error('Rentger Auth Error Details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                keyConfigured: !!RENTGER_API_KEY,
                keyLength: RENTGER_API_KEY ? RENTGER_API_KEY.length : 0
            });
            return null;
        }
    },

    /**
     * Get list of Assets (Properties)
     */
    async getAssets(forceRefresh = false): Promise<RentgerAsset[]> {
        if (!forceRefresh && assetsCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
            return assetsCache;
        }

        const token = await this.authenticate();
        if (!token) throw new Error('Rentger authentication failed');

        try {
            const response = await axios.get(`${BASE_URL}/v1/assets`, {
                headers: {
                    ...commonHeaders,
                    'Authorization': `Bearer ${token}`
                }
            });

            const assets = response.data.data || response.data || [];
            assetsCache = assets;
            cacheTimestamp = Date.now();
            return assets;
        } catch (error: any) {
            console.error('Rentger Get Assets Error:', error.response?.status, error.message);
            return assetsCache || []; // Return stale cache if error occurs
        }
    },

    /**
     * Get contracts for a specific asset
     */
    async getContractsByAsset(assetId: string | number): Promise<RentgerContract[]> {
        const token = await this.authenticate();
        if (!token) throw new Error('Rentger authentication failed');

        try {
            const response = await axios.get(`${BASE_URL}/v1/contracts/asset/${assetId}`, {
                headers: {
                    ...commonHeaders,
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.data || response.data || [];
        } catch (error: any) {
            console.error(`Rentger Get Contracts for Asset ${assetId} Error:`, error.response?.status, error.message);
            return [];
        }
    },

    /**
     * Create a Lead (User type 7)
     */
    async createLead(lead: RentgerLead) {
        const token = await this.authenticate();
        if (!token) throw new Error('Rentger authentication failed');

        try {
            const payload = {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                user_type: 7, // Lead
                gender: 0, // Unknown
                birthdate: '1900-01-01', // Technical required field placeholder
                asset_enc_id: lead.asset_id, // Link to property if provided
                source: lead.source || 'Web RentiA'
            };

            const response = await axios.post(`${BASE_URL}/v1/user`, payload, {
                headers: {
                    ...commonHeaders,
                    'Authorization': `Bearer ${token}`
                }
            });

            return { success: true, data: response.data };
        } catch (error: any) {
            console.error('Rentger Create Lead Error:', error.response?.status, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Error creating lead in Rentger');
        }
    },

    /**
     * Create a Tenant (User type 2)
     */
    async createTenant(user: { name: string; email: string; phone?: string }) {
        const token = await this.authenticate();
        if (!token) throw new Error('Rentger authentication failed');

        try {
            const payload = {
                name: user.name,
                email: user.email,
                phone: user.phone,
                user_type: 2, // Tenant
                gender: 0,
                birthdate: '1990-01-01', // Technical placeholder
            };

            const response = await axios.post(`${BASE_URL}/v1/user`, payload, {
                headers: {
                    ...commonHeaders,
                    'Authorization': `Bearer ${token}`
                }
            });

            // If response is just the ID or token, we normalize
            return { success: true, data: response.data };
        } catch (error: any) {
            console.error('Rentger Create Tenant Error:', error.response?.status, error.response?.data || error.message);
            // If email exists, we might need to handle it. Rentger returns existing user info sometimes.
            throw new Error(error.response?.data?.message || 'Error creating tenant in Rentger');
        }
    },

    /**
     * Create a Contract
     */
    async createContract(contractData: {
        asset_id: string | number;
        tenant_id: string | number;
        date_start: string;
        date_end: string;
        price: number;
        deposit: number;
    }) {
        const token = await this.authenticate();
        if (!token) throw new Error('Rentger authentication failed');

        try {
            const payload = {
                asset_enc_id: contractData.asset_id,
                users: [
                    {
                        user_enc_id: contractData.tenant_id,
                        type: 2 // Tenant
                    }
                ],
                date_start: contractData.date_start,
                date_end: contractData.date_end,
                price: contractData.price,
                deposit: contractData.deposit,
                status: 0, // 0: Borrador/Pendiente
            };

            const response = await axios.post(`${BASE_URL}/v1/contract`, payload, {
                headers: {
                    ...commonHeaders,
                    'Authorization': `Bearer ${token}`
                }
            });

            return { success: true, data: response.data };
        } catch (error: any) {
            console.error('Rentger Create Contract Error:', error.response?.status, error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Error creating contract in Rentger');
        }
    },

    /**
     * Get All Relevant Contracts (Active)
     */
    async getAllActiveContracts(): Promise<RentgerContract[]> {
        const assets = await this.getAssets();
        let allContracts: RentgerContract[] = [];

        // Note: In production with many assets, this should be throttled or paginated
        for (const asset of assets) {
            const contracts = await this.getContractsByAsset(asset.id);
            const mapped = contracts.map(c => ({
                ...c,
                propertyName: asset.alias || asset.name,
                assetId: asset.id
            }));
            allContracts = [...allContracts, ...mapped];
        }

        return allContracts;
    }
};
