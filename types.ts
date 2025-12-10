
export interface TransferRoomData {
    id: number;
    name: string;
    rentPrice: number;
    includedExpenses: string;
    depositHeld: number;
    tenantNationality: string;
    tenantAge: string;
    tenantProfile: 'Estudiante' | 'Trabajador';
    paymentDay: number;
    paymentStatus: 'Al día' | 'Retraso' | 'Impago';
    paymentHistory: string;
    hasFridge: boolean;
    hasAC: boolean;
    hasFan: boolean;
    images: string[];
    observations?: string;
    currentContractUrl?: string; // New: URL of the uploaded PDF contract
}

export interface TransferPropertyData {
    address: string;
    floor: string;
    city: string;
    communityPresident: string;
    communityAdmin: string;
    cleaningFreq: string;
    cleaningCost: string;
    suppliesType: string;
    rules: string;
    organization: string;
    fridgeCount: number;
    structuralIssues: string;
    observations?: string;
}

export type OpportunityScenario = 'sale_living' | 'rent_rooms' | 'rent_traditional';
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
  financials: {
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
  };
  status: 'available' | 'reserved' | 'sold';
  tags: string[];
  roomConfiguration?: { name: string; price: number }[];
}

export interface UserProfile {
    id?: string;
    email: string;
    role: 'owner' | 'tenant' | 'broker' | 'agency' | 'staff' | 'worker';
    name: string;
    phone?: string;
    dni?: string;
    address?: string;
    bankAccount?: string;
    createdAt?: any;
    active?: boolean;
    createdBy?: string;
    gdpr?: {
        signed: boolean;
        signedAt?: any;
        ip?: string;
        documentVersion?: string;
        htmlSnapshot?: string;
    };
}

export interface Contract {
    id: string;
    propertyId: string;
    roomId: string;
    roomName?: string;
    tenantId?: string;
    tenantName: string;
    status: 'active' | 'ended' | 'reserved';
    rentAmount: number;
    depositAmount: number;
    startDate: string;
    endDate: string;
}

export interface InternalNews {
    id: string;
    title: string;
    content: string;
    priority: 'Alta' | 'Normal' | 'Info';
    author: string;
    active: boolean;
    createdAt: any;
}

export type AssetType = 'Vivienda' | 'Piso' | 'Casa independiente' | 'Edificio completo' | 'Habitación';
export type AssetState = 'Buen estado' | 'Reformado' | 'A reformar' | 'Obra nueva' | 'Ruina';
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
    currentRent?: number;
    contractDate?: string;
    images: string[];
    documents: string[];
}

export interface OpportunityRequest {
    id: string;
    collaborator: {
        name: string;
        phone: string;
        email: string;
        relation: string;
    };
    assets: AssetSubmission[];
    isPack: boolean;
    packPrice?: number | null;
    status: 'new' | 'approved' | 'rejected';
    createdAt: any;
    tempRequestId?: string;
}

export interface PropertyDocument {
    id: string;
    propertyId: string;
    name: string;
    type: string;
    url: string;
    uploadedAt?: any;
}

export interface SupplyInvoice {
    id: string;
    propertyId: string;
    type: 'luz' | 'agua' | 'gas' | 'internet' | 'limpieza' | 'otro';
    periodStart: string;
    periodEnd: string;
    amount: number;
    fileUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt?: any;
}

export type StaffMember = 'Pol' | 'Sandra' | 'Víctor' | 'Ayoub' | 'Hugo' | 'Colaboradores' | string;
export type TaskPriority = 'Alta' | 'Media' | 'Baja';
export type TaskStatus = 'Pendiente' | 'En Curso' | 'Completada' | 'Bloqueada';
export type TaskCategory = 'Gestión' | 'Marketing' | 'Legal' | 'Operaciones' | 'Reformas' | 'Contabilidad' | 'Mantenimiento';

export interface TaskBoard {
    id: string;
    title: string;
    group: string;
    createdAt?: any;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assignee: StaffMember;
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    boardId?: string;
    dueDate?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface OwnerAdjustment {
    id: string;
    propertyId: string;
    propertyName: string;
    ownerId: string;
    amount: number;
    concept: string;
    type: 'discount' | 'charge';
    appliedToMonth: string;
    date: any;
}

export type CandidateStatus = 'pending_review' | 'approved' | 'rejected' | 'archived' | 'rented';

export interface Candidate {
    id: string;
    propertyId: string;
    propertyName: string;
    roomId?: string;
    roomName?: string;
    ownerId?: string | null;
    candidateName: string;
    candidatePhone?: string;
    candidateEmail?: string;
    status: CandidateStatus;
    priority?: 'Alta' | 'Media' | 'Baja';
    submittedBy?: string;
    submittedAt?: any;
    assignedTo?: string;
    assignedRoomId?: string;
    assignedDate?: any;
    closureReason?: string;
    additionalInfo?: string;
    sourcePlatform?: string;
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
    commission?: number;
}

export interface WorkerInvoice {
    id: string;
    workerId: string;
    workerName: string;
    amount: number;
    concept: string;
    date: string;
    status: 'pending' | 'paid';
    fileUrl: string;
    fileName: string;
    paymentProofUrl?: string | null;
    createdAt?: any;
}

export const ITP_RATES: Record<string, number> = {
    'Murcia': 8,
    'Andalucía': 7,
    'Comunidad Valenciana': 10,
    'Madrid': 6,
    'Cataluña': 10,
};

export interface TransferAsset {
    id: number;
    property: TransferPropertyData;
    rooms: TransferRoomData[];
    images: string[];
}

export interface PartnerTransferSubmission {
    id?: string;
    collaborator: {
        name: string;
        dni: string;
        phone: string;
        email: string;
    };
    assets: TransferAsset[];
    createdAt: any;
    status: string; // 'pending_review' | 'contacted' | 'integrated'
}
