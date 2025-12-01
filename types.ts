export interface Financials {
  purchasePrice: number;
  itpPercent?: number; // New: Transfer Tax Percentage
  reformCost: number;
  furnitureCost: number;
  notaryAndTaxes: number; // This can now be calculated or manual override
  totalInvestment: number;
  monthlyRentProjected: number; // Room rental total
  monthlyRentTraditional: number; // Traditional rental estimate
  yearlyExpenses: number; // IBI, Community, Insurance
  marketValue: number; // Estimated market value after reform
  appreciationRate: number; // Estimated yearly appreciation percentage
}

export type OpportunityScenario = 'rent_rooms' | 'rent_traditional' | 'rent_both' | 'sale_living';
export type Visibility = 'exact' | 'street_only' | 'hidden';

export interface Opportunity {
  id: string;
  title: string;
  address: string;
  city: string;
  description: string;
  features: string[];
  areaBenefits: string[];
  images: string[];
  videos?: string[];
  driveFolder?: string;
  
  // New: Configuration fields
  scenario: OpportunityScenario;
  visibility: Visibility;
  
  specs: {
    rooms: number;
    bathrooms: number;
    sqm: number;
    floor: string;
    hasElevator: boolean;
  };
  
  // New: Specific room pricing for calculations
  roomConfiguration?: {
    name: string;
    price: number;
  }[];

  financials: Financials;
  status: 'available' | 'reserved' | 'sold';
  tags: string[];
}