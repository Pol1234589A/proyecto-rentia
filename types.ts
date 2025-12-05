
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
  agencyFees?: number; // Manual override for agency fees (base)
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

// --- NEW TYPES FOR CONTRACT MANAGEMENT ---

export interface UserProfile {
    id?: string; // Firebase UID
    // Fix: Add 'guarantor' to the list of valid user roles to match its usage in the ContractManager.
    role: 'owner' | 'tenant' | 'broker' | 'agency' | 'staff' | 'worker' | 'guarantor';
    name: string;
    email: string;
    phone?: string;
    dni?: string;
    address?: string; // Dirección fiscal
    bankAccount?: string; // IBAN
    createdAt?: string;
}

export interface Contract {
    id?: string;
    alias: string; // Nombre amigable del contrato
    propertyId: string;
    roomId: string; // ID de la habitación
    roomName: string;
    
    ownerId: string;
    ownerName: string;
    
    tenantId: string;
    tenantName: string;
    
    guarantorId?: string; // Avalista opcional
    guarantorName?: string;

    startDate: string;
    endDate: string;
    
    rentAmount: number;
    expensesType: 'fixed' | 'shared';
    expensesAmount?: number; // Si es fijo
    
    isProrated: boolean;
    proratedAmount?: number; // Primer mes
    
    depositAmount: number; // Fianza legal
    extraDeposit?: number; // Garantía adicional
    
    status: 'active' | 'pending' | 'ended' | 'reserved';
    createdAt: any;
    documents?: string[]; // URLs de PDFs generados
    isExternal?: boolean; // Si es gestionado fuera (Rentger)
    externalRef?: string;
}

// --- NEW TYPES FOR TASK MANAGER ---

export type StaffMember = 'Pol' | 'Sandra' | 'Víctor' | 'Ayoub' | 'Hugo' | 'Colaboradores';
export type TaskPriority = 'Alta' | 'Media' | 'Baja';
export type TaskStatus = 'Pendiente' | 'En Curso' | 'Completada' | 'Bloqueada';
export type TaskCategory = 'Gestión' | 'Marketing' | 'Legal' | 'Operaciones' | 'Reformas' | 'Contabilidad' | 'Mantenimiento';

export interface TaskBoard {
    id: string;
    title: string;
    group: string; // Para agrupar (ej: "Marketing", "Operaciones")
    createdAt: any;
}

export interface Task {
    id: string;
    boardId?: string; // Link al tablero
    title: string;
    description: string;
    assignee: StaffMember;
    dueDate?: string; // ISO Date string
    priority: TaskPriority;
    status: TaskStatus;
    category: TaskCategory;
    subtasks?: { id: string; text: string; done: boolean }[];
    googleEventId?: string; // Link to Google Calendar
    createdAt: any;
}

// --- NEW TYPES FOR CANDIDATE PIPELINE ---

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
    submittedAt: any; // Firestore Timestamp
    status: CandidateStatus;
    
    // New fields for closure
    closureReason?: string; // Por qué se rechazó o archivó (ej: "Encontró otro piso")
    assignedRoomId?: string; // ID de la habitación si finalmente alquiló
    assignedDate?: any;
}

// --- NEW TYPES FOR ROOM VISITS ---
export type VisitOutcome = 'successful' | 'unsuccessful' | 'pending';

export interface RoomVisit {
    id: string;
    propertyId: string;
    propertyName: string;
    roomId: string;
    roomName: string;
    workerName: string;
    visitDate: any; // Firestore Timestamp
    outcome: VisitOutcome;
    comments: string;
    commission: number;
}

// --- NEW TYPE FOR INTERNAL NEWS ---
export interface InternalNews {
    id: string;
    title: string;
    content: string;
    priority: 'Alta' | 'Normal' | 'Info';
    createdAt: any;
    author: string;
    active: boolean;
}

// --- NEW TYPES FOR OPPORTUNITY REQUESTS (COLLABORATORS) ---

export const ITP_RATES: Record<string, number> = {
    'Andalucía': 7,
    'Aragón': 8,
    'Asturias': 8,
    'Baleares': 8, // Variable, base 8
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
    'País Vasco': 4, // Vizcaya/Álava variable, Gipuzkoa 4
};

export type AssetType = 'Vivienda' | 'Piso' | 'Casa independiente' | 'Edificio completo' | 'Pack de viviendas' | 'Habitación';
export type AssetState = 'Obra nueva' | 'Buen estado' | 'Reformado' | 'Para reformar' | 'Ruina';
export type RentalStatus = 'Sin alquilar' | 'Alquilada completa' | 'Alquilada por habitaciones';

export interface AssetSubmission {
    id: string; // Temporary UI ID
    type: AssetType;
    title: string;
    province: string;
    region: string; // Comunidad Autónoma
    municipality: string;
    address: string;
    zone: string;
    yearBuilt: number;
    state: AssetState;
    
    // Económicos
    ibi: number;
    otherTaxes: number;
    communityFees: number;
    itpPercent: number;
    price: number;
    
    // Specs
    builtMeters: number;
    usefulMeters: number;
    rooms: number;
    baths: number;
    hasTerrace: boolean;
    hasElevator: boolean;
    hasParking: boolean;
    hasStorage: boolean;
    energyCertificate: string; // "A"-"G" or "Pending"
    
    // Alquiler
    rentalStatus: RentalStatus;
    isRented?: boolean;
    currentRent?: number; // Mensual total
    contractDate?: string;
    rentedRoomsCount?: number;
    
    // Fotos
    images: string[];
    documents: string[]; // URLs
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
    packPrice?: number; // Si es un pack
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
