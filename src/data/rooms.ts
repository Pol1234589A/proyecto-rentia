

export interface TenantInfo {
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  startDate: string;
  endDate: string;
  deposit: number;
  secondTenant?: {
    name: string;
    email: string;
    phone: string;
    idNumber: string;
  }
}

export interface HistoricalTenant extends TenantInfo {
  exitDate: string;
  exitReason?: string;
  incidents?: string;
}

export interface RoomTimelineEvent {
  id: string;
  date: string;
  text: string;
  type: 'info' | 'incident' | 'payment' | 'contract' | 'maintenance' | 'departure' | 'visit' | 'audit';
}

export interface Room {
  id: string;
  name: string;
  price: number;
  status: 'available' | 'occupied' | 'reserved';
  availableFrom?: string;
  targetProfile?: 'students' | 'workers' | 'both';
  expenses: string;
  hasAirConditioning?: boolean;
  hasHeating?: boolean;
  hasFan?: boolean;
  specialStatus?: 'new' | 'renovation';
  images?: string[];
  video?: string;
  notes?: string;
  driveUrl?: string;
  photosDriveUrl?: string;

  sqm?: number;
  bedType?: 'single' | 'double' | 'king' | 'sofa';
  features?: string[];
  description?: string;

  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;

  // New field: Canal privado Admin -> Propietario
  recommendations?: OwnerRecommendation[];

  // Advanced Room Filters
  gender?: 'male' | 'female' | 'both';

  // Publication status
  isPublished?: boolean;

  // Contract/Tenant info
  tenant?: TenantInfo;
  tenantHistory?: HistoricalTenant[];
  timeline?: RoomTimelineEvent[];
  internalScreenshotUrls?: string[];
  isNonPayment?: boolean;
}

export interface CleaningConfig {
  enabled: boolean;
  days: string[];
  hours: string;
  costPerHour: number;
  included: boolean;
  cleanerName?: string;
  cleanerPhone?: string;
  paymentMethod?: 'bizum' | 'transfer' | 'cash';
  paymentDay?: string;
  notes?: string;
  timeline?: RoomTimelineEvent[];
}

export interface OwnerRecommendation {
  id: string;
  date: string;
  text: string;
  type: 'price' | 'improvement' | 'info';
}

export type PaymentFlow = 'tenant_rentia_owner' | 'tenant_owner_rentia';

export interface BillingRecord {
  month: string; // YYYY-MM
  invoiceNumber?: string; // Número de factura correlativo
  invoiceSentDate?: string;
  paymentDate?: string;
  ownerAmount?: number;   // Total transferido al propietario (neto)
  rentiaAmount?: number;  // Comisión ganada por Rentia
  status: 'pending' | 'sent' | 'paid' | 'incident';
  notes?: string;
}

export interface Property {
  id: string;
  ownerId?: string;
  address: string;
  city: string;
  floor?: string;
  door?: string;
  image: string;
  bathrooms?: number;
  googleMapsLink: string;
  driveLink?: string;
  transferDay?: number;
  managementCommission?: number;
  investmentAmount?: number;
  commonZonesImages?: string[];
  ibiYearly?: number;
  communityMonthly?: number;
  insuranceYearly?: number;
  rooms: Room[];
  suppliesConfig?: {
    type: 'fixed' | 'shared';
    fixedAmount?: number;
    roomOverrides?: Record<string, number>; // Mapping of room.id or room.name to specific fixed amount
  };
  cleaningConfig?: CleaningConfig;
  ownerRecommendations?: OwnerRecommendation[];

  // NEW: Community Information
  communityInfo?: {
    presidentPhone?: string;
    adminCompany?: string;
    adminContact?: string;
    insuranceName?: string;
    insurancePhone?: string;
  };

  // Internal Notes (Admin only)
  internalNotes?: string;
  createdAt?: any;

  // Advanced Filters
  features?: string[]; // lift, terrace, exterior, accessible, garden, pool, owner_lives, cleaning_included
  floorType?: 'top' | 'intermediate' | 'ground';
  adType?: 'particular' | 'professional';
  description?: string;

  // Dynamic Tenant Data
  wifiConfig?: {
    ssid?: string;
    password?: string;
  };
  whatsappGroupUrl?: string;
  supportUrls?: {
    incidents?: string;
    general?: string;
  };
  tenantCleaningSchedule?: string; // Ej: "Tu turno: Limpieza de cocina (Lunes)"

  // NEW: Billing Information
  paymentFlow?: PaymentFlow;
  billingHistory?: BillingRecord[];
  bankAccount?: string;
  bankAccountHolder?: string;
  receiptDest?: 'private' | 'group';
  receiptLink?: string;
  totalRooms?: number;
  isPublished?: boolean;
  commissionIncludesIVA?: boolean;
  propertyHistory?: HistoricalTenant[];
  internalScreenshotUrls?: string[];
  screenshotFolderUrl?: string;
  timeline?: RoomTimelineEvent[];
  maintenanceTimeline?: RoomTimelineEvent[];
  cleaningTimeline?: RoomTimelineEvent[];
}

// Función auxiliar para generar enlace de maps
const getMapsLink = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const properties: Property[] = [
  {
    id: 'MIGUELBALLESTA8',
    address: 'Calle Miguel Ballesta 8',
    city: 'Alcantarilla (Murcia)',
    floor: '3º A',
    image: '', // Pendiente subir fotos desde panel
    bathrooms: 2,
    googleMapsLink: getMapsLink('Calle Miguel Ballesta 8, Alcantarilla, Murcia'),
    internalNotes: 'Ref Catastral: 7040903XH5074A0004XH. Seguro: Cajamar 911697470. Cert. Eficiencia: Sí. Cédula: No. Limpieza: 2h/sem (11€+IVA/h). Factura directa a prop. a fin de mes.',
    cleaningConfig: {
      enabled: true,
      days: ['Martes'], // Ejemplo, se puede ajustar
      hours: '2 horas/semana',
      costPerHour: 11,
      included: true,
      cleanerPhone: '+34 606 76 55 10'
    },
    managementCommission: 14,
    commissionIncludesIVA: false,
    rooms: [
      {
        id: 'MIGUELBALLESTA8_H1',
        name: 'H1',
        price: 365,
        status: 'occupied',
        availableFrom: '26/11/2026',
        expenses: '40€ fijos',
        tenant: {
          name: 'Frederic Kere',
          idNumber: 'NIE 29234438',
          email: 'frederickere56@gmail.com',
          phone: '623 42 13 74',
          startDate: '26/11/2025',
          endDate: '26/11/2026',
          deposit: 405,
          secondTenant: {
            name: 'Blaise Kere',
            idNumber: 'NIE E29304761',
            email: 'kblaise292@gmail.com',
            phone: '678860600'
          }
        }
      },
      {
        id: 'MIGUELBALLESTA8_H2',
        name: 'H2',
        price: 280,
        status: 'occupied',
        availableFrom: '04/12/2026',
        expenses: '40€ fijos',
        tenant: {
          name: 'Sema Magassa',
          idNumber: 'Permiso Z2693224',
          email: 'semamagassa4@gmail.com',
          phone: '631 29 26 84',
          startDate: '04/12/2025',
          endDate: '04/12/2026',
          deposit: 320
        }
      },
      {
        id: 'MIGUELBALLESTA8_H3',
        name: 'H3',
        price: 260,
        status: 'occupied',
        availableFrom: '01/02/2026',
        expenses: '40€ fijos',
        notes: '⚠️ IMPAGO: Se va pronto a su país (Febrero posiblemente). Seguimiento urgente.',
        tenant: {
          name: 'Gonzalo Antonio Bedoya Patiño',
          idNumber: 'Pasaporte BE291872',
          email: 'gonzalobedoyap27@gmail.com',
          phone: '+573234700214',
          startDate: '20/11/2025',
          endDate: '20/11/2026',
          deposit: 300
        }
      },
      {
        id: 'MIGUELBALLESTA8_H4',
        name: 'H4',
        price: 365,
        status: 'occupied',
        availableFrom: '01/12/2026',
        expenses: '40€ fijos',
        tenant: {
          name: 'Lassana Sianka',
          idNumber: 'NIE Z2589488S',
          email: 'diankalassana465@gmail.com',
          phone: '623 49 69 07',
          startDate: '01/12/2025',
          endDate: '01/12/2026',
          deposit: 405,
          secondTenant: {
            name: 'Kabine Tounkara',
            idNumber: 'NIE Z2648474Y',
            email: 'ktounkara46@gmail.com',
            phone: '662632965'
          }
        }
      },
      {
        id: 'MIGUELBALLESTA8_H5',
        name: 'H5',
        price: 355,
        status: 'occupied',
        availableFrom: '26/11/2026',
        expenses: '40€ fijos',
        tenant: {
          name: 'Brehima Tandjigora',
          idNumber: 'NIE E29281877',
          email: 'tandjigoraibrahim978@gmail.com',
          phone: '613 87 88 36',
          startDate: '26/11/2025',
          endDate: '26/11/2026',
          deposit: 395,
          secondTenant: {
            name: 'Adama Traore',
            idNumber: 'NIE E29054727',
            email: '664319594a@gmail.com',
            phone: '664319594'
          }
        }
      },
    ]
  },
  {
    id: 'PRIMEROMAYO54',
    address: 'Av. Primero de Mayo 54',
    city: 'El Palmar (Murcia)',
    floor: '1º Dcha',
    image: '', // Pendiente subir fotos desde panel
    bathrooms: 2,
    googleMapsLink: getMapsLink('Av. Primero de Mayo 54, El Palmar, Murcia'),
    internalNotes: 'Ref Catastral: 2007204XH6020N0020RZ. Seguro: Mutua Madrileña 915555555. 200m2. Cert. Eficiencia: Sí. Cédula: No.',
    rooms: [
      { id: 'PRIMEROMAYO54_H1', name: 'H1', price: 300, status: 'occupied', availableFrom: 'Consultar', expenses: 'Se reparten los gastos' },
      { id: 'PRIMEROMAYO54_H2', name: 'H2', price: 300, status: 'occupied', availableFrom: 'Consultar', expenses: 'Se reparten los gastos' },
      { id: 'PRIMEROMAYO54_H3', name: 'H3', price: 300, status: 'occupied', availableFrom: 'Consultar', expenses: 'Se reparten los gastos' },
      { id: 'PRIMEROMAYO54_H4', name: 'H4', price: 300, status: 'occupied', availableFrom: 'Consultar', expenses: 'Se reparten los gastos' },
      {
        id: 'PRIMEROMAYO54_H5',
        name: 'H5 (Baño Privado)',
        price: 405,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: 'Se reparten los gastos',
        targetProfile: 'both',
        hasFan: true,
        features: ['private_bath', 'tv', 'lock', 'fan'],
        description: 'Habitación con baño privado, TV y ventilador de techo. Vivienda de 200m2 con terraza. Ideal profesionales sanitarios (Cerca Arrixaca).',
        notes: 'Fianza 1 mes. Gastos aparte.'
      },
    ]
  },
  {
    id: 'ROSARIO71',
    address: 'Calle Rosario, 71',
    city: 'La Ñora (Murcia)',
    floor: 'Bajo',
    image: '',
    googleMapsLink: getMapsLink('Calle Rosario, 71, La Ñora, Murcia'),
    rooms: [
      { id: 'ROSARIO71_H1', name: 'H1', price: 330, status: 'occupied', availableFrom: '30/08/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H2', name: 'H2', price: 330, status: 'occupied', availableFrom: '10/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H3', name: 'H3', price: 340, status: 'occupied', availableFrom: '21/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H4', name: 'H4', price: 340, status: 'occupied', availableFrom: '13/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H5', name: 'H5', price: 340, status: 'occupied', availableFrom: '09/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H6', name: 'H6', price: 320, status: 'occupied', availableFrom: '08/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H7', name: 'H7', price: 320, status: 'occupied', availableFrom: '08/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H8', name: 'H8', price: 330, status: 'available', availableFrom: 'Inmediata', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ROSARIO71_H9', name: 'H9', price: 280, status: 'occupied', availableFrom: '06/09/2025', expenses: 'Se reparten los gastos', targetProfile: 'students' },
    ]
  },
  {
    id: 'SANGINES9',
    address: 'Plaza San Ginés, 14',
    city: 'Murcia',
    floor: '1º',
    image: '',
    googleMapsLink: getMapsLink('Plaza San Ginés 14, Murcia'),
    rooms: [
      { id: 'SANGINES9_H1', name: 'H1', price: 280, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANGINES9_H2', name: 'H2', price: 250, status: 'occupied', availableFrom: '05/01/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANGINES9_H3', name: 'H3', price: 264, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANGINES9_H4', name: 'H4', price: 280, status: 'occupied', availableFrom: '01/08/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANGINES9_H5', name: 'H5', price: 240, status: 'occupied', availableFrom: '27/06/2024', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANGINES9_H6', name: 'H6', price: 280, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
    ]
  },
  {
    id: 'C_SALZILLO_2_PALMAR',
    address: 'C. Salzillo 2',
    city: 'El Palmar (Murcia)',
    image: '',
    bathrooms: 1,
    googleMapsLink: getMapsLink('C. Salzillo 2, El Palmar, Murcia'),
    transferDay: 8,
    managementCommission: 15,
    paymentFlow: 'tenant_rentia_owner',
    rooms: [
      { id: 'C_SALZILLO_2_PALMAR_H1', name: 'H1', price: 350, status: 'occupied', availableFrom: '01/08/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'C_SALZILLO_2_PALMAR_H2', name: 'H2', price: 330, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'C_SALZILLO_2_PALMAR_H3', name: 'H3', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'C_SALZILLO_2_PALMAR_H4', name: 'H4', price: 250, status: 'occupied', availableFrom: '02/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
    ]
  },
  {
    id: 'SANJOSE16',
    address: 'Calle San Jose 16',
    city: 'Murcia',
    image: '',
    googleMapsLink: getMapsLink('Calle San Jose 16, Murcia'),
    rooms: [
      { id: 'SANJOSE16_H1', name: 'H1', price: 325, status: 'occupied', availableFrom: '14/07/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANJOSE16_H2', name: 'H2', price: 315, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANJOSE16_H3', name: 'H3', price: 325, status: 'occupied', availableFrom: '31/07/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANJOSE16_H4', name: 'H4', price: 325, status: 'occupied', availableFrom: '31/07/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'SANJOSE16_H5', name: 'H5', price: 340, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
    ]
  },
  {
    id: 'GUILLAMON27',
    address: 'C. Antonio Flores Guillamón, 27',
    city: 'Espinardo (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('C. Antonio Flores Guillamón, 27, Espinardo, Murcia'),
    rooms: [
      { id: 'GUILLAMON27_H1', name: 'H1', price: 340, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Se reparten los gastos' },
      { id: 'GUILLAMON27_H2', name: 'H2', price: 270, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Se reparten los gastos' },
      { id: 'GUILLAMON27_H3', name: 'H3', price: 270, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Se reparten los gastos' },
      { id: 'GUILLAMON27_H4', name: 'H4', price: 250, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Se reparten los gastos' },
    ]
  },
  {
    id: 'SANMARCOS21',
    address: 'Calle San Marcos 21',
    city: 'Barrio del Carmen (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle San Marcos 21, Barrio del Carmen, Murcia'),
    rooms: [
      { id: 'SANMARCOS_21_H1', name: 'H1', price: 260, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'SANMARCOS_21_H2', name: 'H2', price: 340, status: 'occupied', availableFrom: '01/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'SANMARCOS21_H3', name: 'H3', price: 280, status: 'occupied', availableFrom: '03/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'SANMARCOS21_H4', name: 'H4', price: 250, status: 'occupied', availableFrom: '29/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'SANMARCOS21_H5', name: 'H5', price: 340, status: 'occupied', availableFrom: '03/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
    ]
  },
  {
    id: 'SANTARITA2',
    address: 'Calle Santa Rita 2',
    city: 'Patiño (Murcia)',
    image: '',
    bathrooms: 1,
    googleMapsLink: getMapsLink('Calle Santa Rita 2, Patiño, Murcia'),
    rooms: [
      { id: 'SANTARITA2_H1', name: 'H1', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'new', notes: 'Recién en el mercado' },
      { id: 'SANTARITA2_H2', name: 'H2', price: 270, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'new', notes: 'Recién en el mercado' },
      { id: 'SANTARITA2_H3', name: 'H3', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'new', notes: 'Recién en el mercado' },
      { id: 'SANTARITA2_H4', name: 'H4', price: 230, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'new', notes: 'Recién en el mercado' },
    ]
  },
  {
    id: 'ARCIPRESTE',
    address: 'C/ Arcipreste Mariano Aroca 4',
    city: 'Barrio del Carmen (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('C/ Arcipreste Mariano Aroca 4, Barrio del Carmen, Murcia'),
    rooms: [
      { id: 'ARCIPRESTE_H1', name: 'H1', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
      { id: 'ARCIPRESTE_H2', name: 'H2', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
      { id: 'ARCIPRESTE_H3', name: 'H3', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
      { id: 'ARCIPRESTE_H4', name: 'H4', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
    ]
  },
  {
    id: 'CRISTOBAL11',
    address: 'Calle San Cristobal 11',
    city: 'Molina de Segura (Murcia)',
    image: '',
    bathrooms: 1,
    googleMapsLink: getMapsLink('Calle San Cristobal 11, Molina de Segura, Murcia'),
    rooms: [
      { id: 'CRISTOBAL11_H1', name: 'H1', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'workers', specialStatus: 'new', notes: 'Recién en el mercado' },
      { id: 'CRISTOBAL11_H2', name: 'H2', price: 280, status: 'occupied', availableFrom: '14/11/2025', expenses: 'Gastos fijos aparte', targetProfile: 'workers', specialStatus: 'new', notes: 'Recién en el mercado' },
      { id: 'CRISTOBAL11_H3', name: 'H3', price: 240, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'workers', specialStatus: 'new', notes: 'Recién en el mercado' },
      { id: 'CRISTOBAL11_H4', name: 'H4', price: 240, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'workers', specialStatus: 'new', notes: 'Recién en el mercado' },
    ]
  },
  {
    id: 'MAYOR',
    address: 'Calle Mayor 5',
    city: 'Alcantarilla (Murcia)',
    image: '',
    bathrooms: 2,
    googleMapsLink: getMapsLink('Calle Mayor 5, Alcantarilla, Murcia'),
    rooms: [
      { id: 'MAYOR_H1', name: 'H1', price: 260, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
      { id: 'MAYOR_H2', name: 'H2', price: 290, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
      { id: 'MAYOR_H3', name: 'H3', price: 270, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
      { id: 'MAYOR_H4', name: 'H4', price: 270, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
      { id: 'MAYOR_H5', name: 'H5', price: 290, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
      { id: 'MAYOR_H6', name: 'H6', price: 240, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
      { id: 'MAYOR_H7', name: 'H7', price: 240, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both', specialStatus: 'renovation', notes: 'En reformas. Disponible a partir del 1 enero 2026' },
    ]
  },
  {
    id: 'JESUSQUESADA',
    address: 'Calle Jesús Quesada 12, 3º Izda',
    city: 'Murcia',
    image: '',
    bathrooms: 1,
    googleMapsLink: getMapsLink('Calle Jesús Quesada 12, Murcia'),
    rooms: [
      { id: 'JESUSQUESADA_H1', name: 'H1', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
      { id: 'JESUSQUESADA_H2', name: 'H2', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
      { id: 'JESUSQUESADA_H3', name: 'H3', price: 0, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', notes: 'Precio pendiente' },
      { id: 'JESUSQUESADA_H4', name: 'H4', price: 270, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
    ]
  }
];
