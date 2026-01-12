
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
    videos?: string[];
    roomConfiguration?: { name: string, price: number }[];
    disableLivingRoomExpansion?: boolean;
    createdAt?: string | any; // Timestamp or ISO string
    active?: boolean; // Controls visibility/publication status
}

export interface Contract {
    id: string;
    propertyId: string;
    roomId: string;
    tenantName: string;
    tenantId?: string;
    rentAmount: number;
    depositAmount: number;
    startDate: string;
    endDate?: string;
    status: 'active' | 'finished' | 'reserved';
    fileUrl?: string;
    propertyName?: string;
    roomName?: string;
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
    type: string | AssetType;
    title: string;
    province: string;
    region: string;
    municipality: string;
    address: string;
    zone: string;
    yearBuilt: number;
    state: string | AssetState;
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
    rentalStatus: string | RentalStatus;
    currentRent?: number;
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
    collaborationType?: 'direct_private' | 'agency_investors_only' | 'agency_mls_open';
}

export interface PropertyDocument {
    id: string;
    propertyId: string;
    name: string;
    type: string;
    url: string;
    uploadedAt?: any;
    ownerId?: string;
}

export type StaffMember = 'Víctor' | 'Administración' | 'Ayoub' | 'Hugo' | 'Colaboradores';
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
    dueDate?: string;
    boardId?: string;
    createdAt?: any;
    updatedAt?: any;
    // Campos para incidencias
    tenantId?: string;
    propertyId?: string;
    comments?: {
        id: string;
        author: string;
        content: string;
        createdAt: any;
        role: 'staff' | 'tenant';
    }[];
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
    candidateName: string;
    candidatePhone: string;
    candidateEmail?: string;
    propertyName?: string;
    propertyId?: string;
    roomName?: string;
    roomId?: string;
    status: CandidateStatus;
    priority?: 'Alta' | 'Media' | 'Baja';
    submittedBy?: string;
    submittedAt?: any;
    additionalInfo?: string;
    assignedTo?: StaffMember;
    closureReason?: string;
    assignedDate?: any;
    assignedRoomId?: string;
    sourcePlatform?: string;
}

export interface SupplyInvoice {
    id: string;
    propertyId: string;
    type: 'luz' | 'agua' | 'gas' | 'internet' | 'otro';
    amount: number;
    periodStart: string;
    periodEnd: string;
    fileUrl: string;
    status: 'pending' | 'approved';
    uploadedAt?: any;
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
    fileUrl?: string;
    paymentProofUrl?: string;
    fileName?: string;
    createdAt?: any;
}

export interface UserProfile {
    id?: string;
    uid?: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    dni?: string;
    address?: string;
    bankAccount?: string;
    active?: boolean;
    emailVerified?: boolean;
    doubleOptIn?: {
        verificationSent: boolean;
        acceptedAt: any;
        ip?: string;
    };
    createdAt?: any;
    gdpr?: {
        signed: boolean;
        signedAt?: any;
        documentVersion?: string;
        htmlSnapshot?: string;
        ip?: string;
    };
}

export const ITP_RATES: Record<string, number> = {
    'Murcia': 8,
    'Andalucía': 7,
    'Comunidad Valenciana': 10,
    'Madrid': 6,
    'Cataluña': 10,
    'Castilla-La Mancha': 9,
    'Castilla y León': 8,
    'Aragón': 8,
    'Galicia': 9,
    'Canarias': 6.5,
    'Extremadura': 8,
    'Baleares': 8,
    'Asturias': 8,
    'Cantabria': 10,
    'La Rioja': 7,
    'Navarra': 6,
    'País Vasco': 4
};

export interface AgencyInvoice {
    id: string;
    invoiceNumber: string;
    date: string;
    ownerId: string;
    ownerName: string;
    propertyId?: string;
    propertyAddress?: string;
    totalAmount: number;
    agencyFee: number;
    ivaAmount: number;
    details?: any;
    status: 'issued' | 'paid';
    fileUrl?: string; // URL al PDF en Storage
    fileName?: string; // Nombre del archivo original
    createdAt?: any;
}

export interface TransferRoomData {
    id: number;
    name: string;
    rentPrice: number;
    includedExpenses: string;
    depositHeld: number;
    tenantNationality: string;
    tenantAge: string;
    tenantProfile: string;
    paymentDay: number;
    paymentStatus: string;
    paymentHistory: string;
    hasFridge: boolean;
    hasAC: boolean;
    hasFan: boolean;
    images: string[];
    observations: string;
    currentContractUrl: string;
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
    observations: string;
}

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
        relation: string;
    };
    assets: TransferAsset[];
    // Deprecated single prop fields just in case (optional)
    property?: TransferPropertyData;
    rooms?: TransferRoomData[];

    isPack?: boolean;
    packPrice?: number;
    status: 'pending_review' | 'contacted' | 'integrated';
    createdAt: any;
    tempRequestId?: string;
}

export interface ManagementLead {
    id: string;
    contact: { name: string; email: string; phone: string; dni: string };
    property: {
        address: string;
        city: string;
        type: string;
        rentalStrategy: 'rooms' | 'traditional';
        catastralRef: string;
        ibi: string;
        communityFee: string;
        derramas: string;
        observations: string;
    };
    pricing: {
        strategy: string;
        traditionalPrice: number | null;
        rooms: { id: number; name: string; price: number; images: string[] }[] | null;
    };
    images: { common: string[] };
    documents?: {
        dniFront: string;
        dniBack: string;
        escritura: string;
        bankCertificate: string;
    };
    calculatorData: { estimatedFee: number; declaredProperties: number };
    status: string;
    createdAt: any;
    consent?: any;
    tempId?: string;
    linkedOwnerId?: string; // New field for linked user ID
}

// --- CMS TYPES ---
export interface HomeHeroContent {
    titlePrefix: string;
    titleHighlight: string;
    subtitle: string;
    backgroundImage: string;
    ctaPrimary: string;
    ctaSecondary: string;
    overlayOpacity: number;
}

export interface HomeSolutionsContent {
    title: string;
    subtitle: string;
    card1Title: string;
    card1Desc: string;
    card2Title: string;
    card2Desc: string;
}

export interface HomeCTAContent {
    title: string;
    subtitle: string;
    image: string;
    buttonText: string;
}

export interface HomePageContent {
    hero: HomeHeroContent;
    solutions: HomeSolutionsContent;
    cta: HomeCTAContent;
}