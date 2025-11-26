export interface Financials {
  purchasePrice: number;
  reformCost: number;
  furnitureCost: number;
  notaryAndTaxes: number;
  totalInvestment: number;
  monthlyRentProjected: number; // Room rental total
  monthlyRentTraditional: number; // Traditional rental estimate
  yearlyExpenses: number; // IBI, Community, Insurance
  marketValue: number; // Estimated market value after reform
  appreciationRate: number; // Estimated yearly appreciation percentage
}

export interface Opportunity {
  id: string;
  title: string;
  address: string;
  city: string;
  description: string;
  features: string[];
  areaBenefits: string[]; // New: Benefits of the area
  images: string[];
  videos?: string[]; // Added support for videos
  driveFolder?: string; // New: Link to Google Drive folder
  specs: {
    rooms: number;
    bathrooms: number;
    sqm: number;
    floor: string;
    hasElevator: boolean;
  };
  financials: Financials;
  status: 'available' | 'reserved' | 'sold';
  tags: string[];
}