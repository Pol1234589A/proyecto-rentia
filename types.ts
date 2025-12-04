




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

export type CandidateStatus = 'pending_review' | 'approved' | 'rejected' | 'archived';

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
