
export interface Financials {
  purchasePrice: number;
  itpPercent?: number; 
  reformCost: number;
  furnitureCost: number;
  notaryAndTaxes: number; 
  totalInvestment: number;
  monthlyRentProjected: number; 
  monthlyRentTraditional: number; 
  yearlyExpenses: number; 
  marketValue: number; 
  appreciationRate: number; 
  agencyFees?: number; 
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
  scenario: OpportunityScenario;
  visibility: Visibility;
  specs: {
    rooms: number;
    bathrooms: number;
    sqm: number;
    floor: string;
    hasElevator: boolean;
  };
  roomConfiguration?: {
    name: string;
    price: number;
  }[];
  financials: Financials;
  status: 'available' | 'reserved' | 'sold';
  tags: string[];
}

// --- NEW TYPES FOR OWNER PORTAL ---

export interface UserProfile {
    id?: string; 
    role: 'owner' | 'tenant' | 'broker' | 'agency' | 'staff' | 'worker' | 'guarantor';
    name: string;
    email: string;
    phone?: string;
    dni?: string;
    address?: string; // Dirección fiscal
    bankAccount?: string; // IBAN
    idDocumentUrl?: string; // URL imagen DNI
    createdAt?: string;
    active?: boolean;
    // GDPR Compliance
    gdpr?: {
        signed: boolean;
        signedAt: any;
        ip: string;
        signatureUrl: string;
        documentVersion: string;
    };
}

export interface PropertyDocument {
    id: string;
    propertyId: string;
    name: string;
    type: 'escritura' | 'catastro' | 'certificado_energetico' | 'licencia' | 'plano' | 'reforma' | 'otro';
    url: string;
    uploadedAt: any;
}

export interface SupplyInvoice {
    id: string;
    propertyId: string;
    type: 'luz' | 'agua' | 'gas' | 'internet' | 'comunidad' | 'basuras' | 'otro';
    periodStart: string;
    periodEnd: string;
    amount: number;
    fileUrl: string;
    uploadedAt: any;
    status: 'pending' | 'approved' | 'rejected';
}

export interface Contract {
    id?: string;
    alias: string; 
    propertyId: string;
    roomId: string; 
    roomName: string;
    ownerId: string;
    ownerName: string;
    tenantId: string;
    tenantName: string;
    guarantorId?: string; 
    guarantorName?: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    expensesType: 'fixed' | 'shared';
    expensesAmount?: number; 
    isProrated: boolean;
    proratedAmount?: number; 
    depositAmount: number; 
    extraDeposit?: number; 
    status: 'active' | 'pending' | 'ended' | 'reserved';
    createdAt: any;
    documents?: string[]; 
    isExternal?: boolean; 
    externalRef?: string;
}

export interface OwnerAdjustment {
    id: string;
    propertyId: string;
    propertyName: string;
    ownerId: string;
    type: 'discount' | 'charge'; 
    amount: number;
    concept: string; 
    date: any; 
    appliedToMonth: string; 
}

export type StaffMember = 'Pol' | 'Sandra' | 'Víctor' | 'Ayoub' | 'Hugo' | 'Colaboradores';
export type TaskPriority = 'Alta' | 'Media' | 'Baja';
export type TaskStatus = 'Pendiente' | 'En Curso' | 'Completada' | 'Bloqueada';
export type TaskCategory = 'Gestión' | 'Marketing' | 'Legal' | 'Operaciones' | 'Reformas' | 'Contabilidad' | 'Mantenimiento';

export interface TaskBoard {
    id: string;
    title: string;
    group: string; 
    createdAt: any;
}

export interface Task {
    id: string;
    boardId?: string; 
    title: string;
    description: string;
    assignee: StaffMember;
    dueDate?: string; 
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    subtasks?: { id: string; text: string; done: boolean }[];
    googleEventId?: string; 
    createdAt: any;
}

export type CandidateStatus = 'pending_review' | 'approved' | 'rejected' | 'archived' | 'rented';

export interface Candidate {
    id: string;
    candidateName: string;
    candidatePhone?: string;
    candidateEmail?: string;
    additionalInfo: string;
    propertyId: string;
    propertyName: string;
    roomId: string;
    roomName: string;
    submittedBy: string;
    submittedAt: any; 
    status: CandidateStatus;
    closureReason?: string; 
    assignedRoomId?: string; 
    assignedDate?: any;
}

export type VisitOutcome = 'successful' | 'unsuccessful' | 'pending';

export interface RoomVisit {
    id: string;
    propertyId: string;
    propertyName: string;
    roomId: string;
    roomName: string;
    workerName: string;
    visitDate: any; 
    outcome: VisitOutcome;
    comments: string;
    commission: number;
}

export interface InternalNews {
    id: string;
    title: string;
    content: string;
    priority: 'Alta' | 'Normal' | 'Info';
    createdAt: any;
    author: string;
    active: boolean;
}

export const ITP_RATES: Record<string, number> = {
    'Andalucía': 7,
    'Aragón': 8,
    'Asturias': 8,
    'Baleares': 8, 
    'Canarias': 6.5,
    'Cantabria': 10,
    'Castilla-La Mancha': 9,
    'Castilla y León': 8,
    'Cataluña': 10,
    'Ceuta': 6,
    'Comunidad Valenciana': 10,
    'Extremadura': 8,
    'Galicia': 10,
    'La Rioja': 7,
    'Madrid': 6,
    'Melilla': 6,
    'Murcia': 8,
    'Navarra': 6,
    'País Vasco': 4, 
};

export type AssetType = 'Vivienda' | 'Piso' | 'Casa independiente' | 'Edificio completo' | 'Pack de viviendas' | 'Habitación';
export type AssetState = 'Obra nueva' | 'Buen estado' | 'Reformado' | 'Para reformar' | 'Ruina';
export type RentalStatus = 'Sin alquilar' | 'Alquilada completa' | 'Alquilada por habitaciones';

export interface AssetSubmission {
    id: string; 
    type: AssetType;
    title: string;
    province: string;
    region: string; 
    municipality: string;
    address: string;
    zone: string;
    yearBuilt: number;
    state: AssetState;
    ibi: number;
    otherTaxes: number;
    communityFees: number;
    itpPercent: number;
    price: number;
    builtMeters: number;
    usefulMeters: number;
    rooms: number;
    baths: number;
    hasTerrace: boolean;
    hasElevator: boolean;
    hasParking: boolean;
    hasStorage: boolean;
    energyCertificate: string; 
    rentalStatus: RentalStatus;
    isRented?: boolean;
    currentRent?: number; 
    contractDate?: string;
    rentedRoomsCount?: number;
    images: string[];
    documents: string[]; 
}

export interface OpportunityRequest {
    id: string;
    collaborator: {
        name: string;
        phone: string;
        email: string;
        relation: 'propietario' | 'mediador' | 'agencia' | 'amigo' | 'otro';
    };
    assets: AssetSubmission[];
    packPrice?: number; 
    isBuilding?: boolean;
    buildingDetails?: {
        totalUnits: number;
        totalLocals: number;
        floors: number;
        cadastralRef: string;
        occupation: string;
    };
    status: 'new' | 'reviewing' | 'approved' | 'rejected';
    createdAt: any;
    gdprAccepted: boolean;
    dataPolicyAccepted: boolean;
}