

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
  ownerName?: string;
  ownerPhone?: string;
  address: string;
  city: string;
  floor?: string;
  door?: string;
  image: string;
  video?: string;
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
  internalNotes?: string;
  createdAt?: any;

  // Filters and metadata
  features?: string[];
  floorType?: 'top' | 'intermediate' | 'ground';
  adType?: 'particular' | 'professional';
  description?: string;

  // Live Management Data
  bankAccount?: string;
  bankAccountHolder?: string;
  paymentFlow?: PaymentFlow;
  forSale?: boolean;
  totalRooms?: number;
  commissionIncludesIVA?: boolean;
  commissionBaseDeduction?: number;
  receiptDest?: 'private' | 'group';
  receiptLink?: string;
  isPublished?: boolean;
  photosDriveUrl?: string;
  billingHistory?: BillingRecord[];
  whatsappGroupUrl?: string;
  wifiConfig?: {
    ssid?: string;
    password?: string;
  };

  // Community and History
  communityInfo?: {
    presidentPhone?: string;
    adminCompany?: string;
    adminContact?: string;
    insuranceName?: string;
    insurancePhone?: string;
  };
  propertyHistory?: HistoricalTenant[];
  internalScreenshotUrls?: string[];
  screenshotFolderUrl?: string;
  timeline?: RoomTimelineEvent[];
  maintenanceTimeline?: RoomTimelineEvent[];
  cleaningTimeline?: RoomTimelineEvent[];
  supportUrls?: {
    incidents?: string;
    general?: string;
  };
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
    ownerName: 'Arelys (Propietaria)',
    ownerPhone: '+34 606 76 55 10',
    internalNotes: 'Ref Catastral: 7040903XH5074A0004XH. Seguro: Cajamar 911697470. Cert. Eficiencia: Sí. Cédula: No. LLAVES: Arelys (1 juego), Rentia (1 juego), Pol (2 juegos). PROTOCOLO: Fotos/vídeos tras limpieza.',
    cleaningConfig: {
      enabled: true,
      days: ['Martes'],
      hours: '2 horas/semana',
      costPerHour: 11,
      included: true,
      cleanerName: 'Arelys',
      cleanerPhone: '+34 606 76 55 10',
      paymentMethod: 'bizum',
      notes: 'Incluye productos. Factura mes a mes a propietaria.'
    },
    timeline: [],
    managementCommission: 14,
    commissionIncludesIVA: false,
    paymentFlow: 'tenant_rentia_owner',
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
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: '50€ fijos',
        notes: 'DISPONIBLE PARA ENSEÑAR. Pendiente sábanas y publicar. Limpieza completada (Arelys 04/02) pero no incluyen lavado de sábanas.',
        timeline: [
          { id: 'MB8_H3_EXIT', date: '01/02/2026', text: 'Gonzalo (+573234700214) finaliza estancia. Habitación disponible.', type: 'departure' },
          { id: 'MB8_CLEANING_COORD', date: '03/02/2026', text: 'Coordinando limpieza integral con Arelys (+34 606 76 55 10).', type: 'maintenance' },
          { id: 'MB8_CLEANING_DONE', date: '04/02/2026', text: 'Arelys (+34 606 76 55 10) confirma limpieza lista y manda vídeos. No incluye limpieza de sábanas.', type: 'maintenance' }
        ],
        tenantHistory: [
          {
            name: 'Gonzalo Antonio Bedoya Patiño',
            idNumber: 'Pasaporte BE291872',
            email: 'gonzalobedoyap27@gmail.com',
            phone: '+573234700214',
            startDate: '20/11/2025',
            endDate: '20/11/2026',
            exitDate: '01/02/2026',
            exitReason: 'Abandono anticipado',
            deposit: 300
          }
        ]
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
    video: 'https://drive.google.com/file/d/1RXgU7cICJ-XI8XMDCq_CLHxVQ4fXZ69m/view',
    bathrooms: 2,
    googleMapsLink: getMapsLink('Av. Primero de Mayo 54, El Palmar, Murcia'),
    driveLink: 'https://drive.google.com/drive/folders/1IUWatoqopzC-ZuyEAPfVNKSc2GO7CvID',
    photosDriveUrl: 'https://drive.google.com/drive/folders/1v1Xh7iD-kcu9277ls1-rZVibv1Lco87u',
    ownerName: 'Laura Sinausia Nieva',
    ownerPhone: '+34 672 88 63 69 (Gestora)',
    internalNotes: 'Ref Catastral: 2007204XH6020N0020RZ. Seguro: Mutua Madrileña 915555555. 200m2. Cert. Eficiencia: Sí. Cédula: No. LIQUIDACIÓN ESPECIAL: H2 y H4 Cuota Fija Mínima 35€/mes. H1, H3 y H5 prorrateo puro.',
    bankAccount: 'ES29 3058 0351 6227 2001 6478',
    bankAccountHolder: 'RENTIA INVESTMENTS, S.L.',
    timeline: [
      { id: 'PM54_H3_CONTRACT', date: '01/01/2025', text: 'Inicio contrato H3: María José Fariña Rodríguez (+34 617 89 16 24)', type: 'contract' },
      { id: 'PM54_H5_CONTRACT', date: '01/01/2025', text: 'Inicio contrato H5: Diego Mauricio Terán Campelo (+34 611 177 807)', type: 'contract' },
      { id: 'PM54_H4_CONTRACT', date: '20/09/2025', text: 'Inicio contrato H4: Aarón Joshua Hoskin (e.d.f.)', type: 'contract' },
      { id: 'PM54_H4_MARIA_CHANGE', date: '29/01/2026', text: 'María José (+34 617 89 16 24) se muda de H3 a H4 por novación', type: 'maintenance' },
      { id: 'PM54_H4_MARIA_START', date: '01/02/2026', text: 'Inicio contrato H4: María José Fariña Rodríguez (+34 617 89 16 24)', type: 'contract' },
    ],
    totalRooms: 5,
    paymentFlow: 'tenant_rentia_owner',
    managementCommission: 15,
    rooms: [
      {
        id: 'PRIMEROMAYO54_H1',
        name: 'H1',
        price: 280,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: 'Prorrateo proporcional por días (Provisión de 25€)',
        driveUrl: 'https://drive.google.com/drive/folders/1C3F-EZr6vlA2uDmsaYFiV0qUrHsAH6jV',
        tenant: {
          name: 'Óscar Mauricio Gómez Arango',
          email: 'sonerolatino1978@gmail.com',
          phone: '+34 603 665 819',
          idNumber: '71778947',
          startDate: '01/02/2026',
          endDate: '31/07/2026',
          deposit: 280
        },
        timeline: [
          { id: 'PM54_H1_RENEWAL', date: '01/02/2026', text: 'Renovación contrato: Óscar Mauricio Gómez Arango. Renta 280€ + gastos. Fin: 31/07/2026.', type: 'contract' }
        ]
      },
      {
        id: 'PRIMEROMAYO54_H2',
        name: 'H2',
        price: 415,
        status: 'occupied',
        availableFrom: '12/09/2026',
        expenses: 'Incluidos hasta 35€/mes',
        driveUrl: 'https://drive.google.com/drive/folders/1U-TM16Qoj1JUe5xV_U0mL2xB9MSBj8qG',
        tenant: {
          name: 'Edmundo Fulgencio Muñoz Clemente',
          email: 'edmundofulgencio@gmail.com',
          phone: '+34 699 33 29 55',
          idNumber: '22450207E',
          startDate: '12/09/2025',
          endDate: '12/09/2026',
          deposit: 300
        },
        timeline: [
          { id: 'PM54_H2_CONTRACT', date: '12/09/2025', text: 'Inicio contrato: Edmundo Fulgencio Muñoz Clemente. Renta 415€. Fianza 300€. Gastos incl. hasta 35€.', type: 'contract' }
        ]
      },
      {
        id: 'PRIMEROMAYO54_H3',
        name: 'H3',
        price: 415,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: '40€ fijos (Individual) / 80€ fijos (Pareja). Excesos a repartir si superan 40€/hab.',
        notes: 'Precio Pareja: 370€ + 80€ gastos (Total 450€). Incluye protocolo de excedentes.',
        driveUrl: 'https://drive.google.com/drive/folders/1zW3jpW_1duc5feq5OrXKef9hj_-aDMpi',
        timeline: [
          { id: 'H3_MARIA_EXIT', date: '29/01/2026', text: 'María José (+34 617 89 16 24) se muda a la H4. Habitación disponible.', type: 'info' }
        ],
        tenantHistory: [
          {
            name: 'María José Fariña Rodríguez',
            idNumber: '43367226J',
            startDate: '01/01/2025',
            endDate: '31/01/2026',
            exitDate: '29/01/2026',
            exitReason: 'Cambio a habitación H4 (Novación)',
            deposit: 415,
            email: 'mariajosefarina024@gmail.com',
            phone: '+34 617 89 16 24'
          }
        ]
      },
      {
        id: 'PRIMEROMAYO54_H4',
        name: 'H4',
        price: 295,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: 'Incluidos hasta 35€/mes',
        driveUrl: 'https://drive.google.com/drive/folders/1TQpiJa6mzID-r-CYrH3ksUvfxV40VWNT',
        tenant: {
          name: 'María José Fariña Rodríguez',
          email: 'mariajosefarina024@gmail.com',
          phone: '+34 617 89 16 24',
          idNumber: '43367226J',
          startDate: '01/02/2026',
          endDate: '31/07/2026',
          deposit: 415
        },
        timeline: [
          { id: 'PM54_H4_MARIA_ENTRY', date: '01/02/2026', text: 'Entrada inquilina: María José Fariña Rodríguez (Desde H3). Renta 295€. Fianza 415€ mantenida.', type: 'contract' }
        ],
        tenantHistory: [
          {
            name: 'Aarón Joshua Hoskin',
            email: '',
            phone: '',
            idNumber: 'PAS A22245915',
            startDate: '20/09/2025',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            exitReason: 'Salida anticipada (Fin de estancia)',
            deposit: 590
          }
        ]
      },
      {
        id: 'PRIMEROMAYO54_H5',
        name: 'H5 (Baño Privado)',
        price: 405,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: 'Prorrateo proporcional por días (gastos no incluidos)',
        targetProfile: 'both',
        hasFan: true,
        features: ['private_bath', 'tv', 'lock', 'fan'],
        description: 'Habitación con baño privado, TV y ventilador de techo. Vivienda de 200m2 con terraza. Ideal profesionales sanitarios (Cerca Arrixaca).',
        driveUrl: 'https://drive.google.com/drive/folders/1fVvbp4Y9ZvQLeS6HULKEmzFV_R4MNXWQ',
        photosDriveUrl: 'https://drive.google.com/drive/folders/1veoUrZErN4_ApCBO37LVA2YnMhQJw9sk',
        timeline: [
          { id: 'H5_DIEGO_EXIT', date: '29/01/2026', text: 'Diego Mauricio (+34 611 177 807) finaliza estancia.', type: 'info' }
        ],
        tenantHistory: [
          {
            name: 'Diego Mauricio Terán Campelo',
            email: 'Mauricio_tdi@hotmail.com',
            phone: '+34 611 177 807',
            idNumber: 'DNI 34326734Q',
            startDate: '01/01/2025',
            endDate: '31/12/2025',
            exitDate: '29/01/2026',
            deposit: 395
          }
        ]
      },
    ]
  },
  {
    id: 'ROSARIO71',
    address: 'Calle Rosario 71',
    city: 'La Ñora (Murcia)',
    floor: 'Bajo',
    image: '',
    bathrooms: 2,
    googleMapsLink: getMapsLink('Calle Rosario 71, La Ñora, Murcia'),
    ownerName: 'Juan Antonio Belmonte Pérez',
    ownerPhone: '+34 685 615 109',
    internalNotes: 'Ref Catastral: 8364010XH5086S0001YG. Propietario: Juan Antonio Belmonte Pérez. Representado por su hijo: Juan Antonio Belmonte Fernández. PAGO RENTA: Directo al propietario. COMISIÓN: 14% + IVA sobre (Renta - 10€). Esos 10€ son para limpieza y no comisionan. Emitir factura mes a mes (primera semana) por el mes anterior. Pedir justificantes a inquilinos.',
    paymentFlow: 'tenant_owner_rentia',
    managementCommission: 14,
    commissionIncludesIVA: false,
    commissionBaseDeduction: 10,
    cleaningConfig: {
      enabled: true,
      included: true,
      hours: 'Incluida en precio (10€/hab)',
      days: ['Semanal'],
      costPerHour: 0
    },
    rooms: [
      {
        id: 'ROSARIO71_H1',
        name: 'H1',
        price: 330,
        status: 'occupied',
        availableFrom: '20/06/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'LUCA CHRISTIAN PAUL WERMELINGER',
          email: '',
          phone: '+33 663 700 147',
          idNumber: 'DVZ2BJRK3',
          startDate: '30/08/2025',
          endDate: '20/06/2026',
          deposit: 330
        },
        timeline: [
          { id: 'ROS71_H1_START', date: '30/08/2025', text: 'Inicio contrato: LUCA CHRISTIAN PAUL. Renta 330€ (Pago directo a propietario). Fianza 330€.', type: 'contract' }
        ]
      },
      {
        id: 'ROSARIO71_H2',
        name: 'H2',
        price: 320,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'ANDRES ZAPATA HERNÁNDEZ',
          email: '',
          phone: '+34 602 583 621',
          idNumber: '12794730Z',
          startDate: '10/09/2025',
          endDate: '31/07/2026',
          deposit: 320
        },
        timeline: [
          { id: 'ROS71_H2_START', date: '12/07/2025', text: 'Firma contrato: ANDRES ZAPATA. Aval: Aileen Carolina Hernández (12794729J). Renta 320€ (Pago directo dueño). Fianza 320€.', type: 'contract' },
          { id: 'ROS71_H2_ENTRY', date: '10/09/2025', text: 'Inicio estancia y pago mes prorrateado (224€).', type: 'info' }
        ]
      },
      {
        id: 'ROSARIO71_H3',
        name: 'H3',
        price: 340,
        status: 'occupied',
        availableFrom: '01/10/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'IREM KARA',
          email: '',
          phone: '+90 535 287 67 40',
          idNumber: '10523886340',
          startDate: '21/09/2025',
          endDate: '01/10/2026',
          deposit: 330
        },
        timeline: [
          { id: 'ROS71_H3_RESERVE', date: '28/03/2025', text: 'Reserva confirmada y pago de fianza (330€).', type: 'contract' },
          { id: 'ROS71_H3_START', date: '20/08/2025', text: 'Firma contrato: IREM KARA. Renta 340€ (Pago directo dueño).', type: 'contract' },
          { id: 'ROS71_H3_ENTRY', date: '21/09/2025', text: 'Inicio estancia y pago mes prorrateado (113,33€).', type: 'info' }
        ]
      },
      {
        id: 'ROSARIO71_H4',
        name: 'H4',
        price: 340,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'ZÉLIE LUCIE CORALIE COSSART',
          email: '',
          phone: '+33 658 390 712',
          idNumber: '23AZ75706',
          startDate: '13/09/2025',
          endDate: '30/06/2026',
          deposit: 330
        },
        timeline: [
          { id: 'ROS71_H4_RESERVE', date: '25/03/2025', text: 'Reserva y fianza recibida (330€).', type: 'contract' },
          { id: 'ROS71_H4_START', date: '28/08/2025', text: 'Firma contrato: ZÉLIE COSSART. Renta 340€ (Pago directo dueño).', type: 'contract' },
          { id: 'ROS71_H4_ENTRY', date: '13/09/2025', text: 'Inicio estancia y pago mes prorrateado (215,33€).', type: 'info' }
        ]
      },
      {
        id: 'ROSARIO71_H5',
        name: 'H5',
        price: 340,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'EVA DEPRIME',
          email: '',
          phone: '+33 622 786 146',
          idNumber: '25AA69505',
          startDate: '09/09/2025',
          endDate: '30/06/2026',
          deposit: 330
        },
        timeline: [
          { id: 'ROS71_H5_RESERVE', date: '15/05/2025', text: 'Reserva y fianza recibida (330€).', type: 'contract' },
          { id: 'ROS71_H5_START', date: '28/08/2025', text: 'Firma contrato: EVA DEPRIME. Renta 340€ (Pago directo dueño).', type: 'contract' },
          { id: 'ROS71_H5_ENTRY', date: '09/09/2025', text: 'Inicio estancia y pago mes prorrateado (249,33€).', type: 'info' }
        ]
      },
      {
        id: 'ROSARIO71_H6',
        name: 'H6',
        price: 320,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'MIGUEL DURÁN LORENTE',
          email: '',
          phone: '+34 684 285 671',
          idNumber: '23954491Z',
          startDate: '08/09/2025',
          endDate: '30/06/2026',
          deposit: 310
        },
        timeline: [
          { id: 'ROS71_H6_START', date: '03/09/2025', text: 'Firma contrato: MIGUEL DURÁN. Renta 320€ (Pago directo dueño). Fianza 310€.', type: 'contract' },
          { id: 'ROS71_H6_ENTRY', date: '08/09/2025', text: 'Inicio estancia y pago inicial (incluye fianza y parte de septiembre): 245,33€ adicionales.', type: 'info' }
        ]
      },
      {
        id: 'ROSARIO71_H7',
        name: 'H7',
        price: 320,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'PEDRO NAVARRO DÍAZ',
          email: '',
          phone: '+34 658 670 698',
          idNumber: '48835026T',
          startDate: '08/09/2025',
          endDate: '30/06/2026',
          deposit: 310
        },
        timeline: [
          { id: 'ROS71_H7_RESERVE', date: '01/08/2025', text: 'Reserva y fianza recibida (310€).', type: 'contract' },
          { id: 'ROS71_H7_START', date: '08/09/2025', text: 'Firma contrato: PEDRO NAVARRO DÍAZ. Renta 320€ (Pago directo dueño).', type: 'contract' },
          { id: 'ROS71_H7_ENTRY', date: '08/09/2025', text: 'Inicio estancia y pago mes prorrateado (245,33€).', type: 'info' }
        ]
      },
      {
        id: 'ROSARIO71_H8',
        name: 'H8',
        price: 330,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'DANIELA RODRIGUEZ RUIZ',
          email: '',
          phone: '+34 673 75 49 01',
          idNumber: '77425382E',
          startDate: '01/02/2026',
          endDate: '31/07/2026',
          deposit: 330
        },
        timeline: [
          { id: 'ROS71_H8_HIST_JULIE', date: '07/09/2025', text: 'Anterior inquilina: JULIE PAULINE (Hasta 31/01/2026).', type: 'info' },
          { id: 'ROS71_H8_RESERVE_DAN', date: '22/07/2025', text: 'Reserva y fianza recibida (330€).', type: 'contract' },
          { id: 'ROS71_H8_START_DAN', date: '01/02/2026', text: 'Inicio contrato: DANIELA RODRIGUEZ. Renta 330€ (Pago directo dueño).', type: 'contract' }
        ]
      },
      {
        id: 'ROSARIO71_H9',
        name: 'H9',
        price: 290,
        status: 'occupied',
        availableFrom: '17/07/2026',
        expenses: 'Según consumo real',
        targetProfile: 'students',
        tenant: {
          name: 'GABRIEL DONNY',
          email: '',
          phone: '+33 789 994 575',
          idNumber: '160219200429',
          startDate: '06/09/2025',
          endDate: '17/07/2026',
          deposit: 280
        },
        timeline: [
          { id: 'ROS71_H9_RESERVE', date: '01/08/2025', text: 'Fianza y reserva recibida (280€).', type: 'contract' },
          { id: 'ROS71_H9_START', date: '01/09/2025', text: 'Firma contrato: GABRIEL DONNY. Renta 290€ (Pago directo dueño).', type: 'contract' },
          { id: 'ROS71_H9_ENTRY', date: '06/09/2025', text: 'Inicio estancia y pago mes prorrateado (241,66€).', type: 'info' }
        ]
      },
    ]
  },
  {
    id: 'SANGINES9',
    address: 'Plaza San Ginés, 14',
    city: 'Murcia',
    floor: '1º',
    image: '',
    googleMapsLink: getMapsLink('Plaza San Ginés 14, Murcia'),
    cleaningConfig: {
      enabled: true,
      cleanerName: 'Luisa Hernández',
      cleanerPhone: '+34 624 99 00 64',
      costPerHour: 10,
      days: [],
      hours: '',
      included: false,
      notes: 'Productos aportados por propietarios/inquilinos.'
    },
    internalNotes: 'LIMPIEZA: Luisa Hernández (+34 624 99 00 64). Cobra 10€/h. Productos aportados por propietarios/inquilinos.',
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
    forSale: true,
    ownerName: 'José Bayonas Martínez / Elvira Martínez Moya',
    ownerPhone: '(Venta en proceso)',
    cleaningConfig: {
      enabled: true,
      days: ['Pendiente'],
      hours: '1 vez/semana',
      cleanerName: 'Propietario coordina',
      costPerHour: 0,
      paymentMethod: 'cash',
      paymentDay: 'Semanal',
      included: true,
      notes: 'Limpieza pagada y coordinada directamente por el propietario actual. (Paga Prop. en efectivo)'
    },
    internalNotes: '⚠️ EN VENTA: Arras firmadas el 04/02/2026. Vendida a otra gestora. Contacto comprador/gestión: +34 613 56 00 50. LIMPIEZA: Semanal (paga prop.). LLAVES: Rentia tiene copia.',
    timeline: [
      { id: 'CS2_TASADOR_COORD', date: '04/02/2026', text: 'COORDINACIÓN TASADOR: El comprador solicita tasación. Tasador introducido en el grupo de WhatsApp de inquilinos para coordinar visita directa. No requiere asistencia presencial de Rentia.', type: 'info' },
      { id: 'CS2_ARRAS_SIGNED', date: '04/02/2026', text: 'FIRMA DE ARRAS: Propiedad vendida a otra gestora. Proceso de traspaso de contratos en marcha para notaría.', type: 'info' },
      { id: 'CS2_H1_MARIA_EXIT', date: '31/01/2026', text: 'María Pérez Ruiz (+34 722 49 48 61) abandona H1 por causa de fuerza mayor (enfermedad familiar). Se devuelve fianza por decisión administrativa.', type: 'departure' },
      { id: 'CS2_NOVACION_ALEJANDRO', date: '01/02/2026', text: 'Anexo Novación H1: Alejandro Fernández Vieites (+34 644 454 351). Renta 350€ + 40€ suministros. Salida irrevocable 31/03/2026. Pago inicial 490€ (Renta + Diferencia Fianza).', type: 'contract' },
      { id: 'CS2_H2_CONTRACT_KEVIN', date: '12/09/2025', text: '1ª Prórroga H2: Kevin Holzmann (+34 670 10 25 42). Hasta 30/11/2025.', type: 'contract' },
      { id: 'CS2_H2_PRORROGA_KEVIN_2', date: '30/11/2025', text: '2ª Prórroga H2: Kevin Holzmann (+34 670 10 25 42). Hasta 31/01/2026.', type: 'contract' },
      { id: 'CS2_H2_PRORROGA_KEVIN_3', date: '22/01/2026', text: '3ª Prórroga H2: Kevin Holzmann (+34 670 10 25 42). Hasta 30/04/2026.', type: 'contract' },
      { id: 'CS2_H3_LITTZY_CONTRACT', date: '12/12/2025', text: 'Contrato H3: Littzy Ninfa Álvares Rodríguez (+34 610 75 35 88). Hasta 31/03/2026. Avalista: Wilson Iriarte (+34 662 29 41 65).', type: 'contract' },
      { id: 'CS2_H1_MARIA_DOC_PENDING', date: '03/02/2026', text: 'PENDIENTE: Mandar documento de salida a María Pérez Ruiz (+34 722 49 48 61) (H1).', type: 'info' }
    ],
    rooms: [
      {
        id: 'C_SALZILLO_2_PALMAR_H1',
        name: 'H1',
        price: 350,
        status: 'occupied',
        availableFrom: '01/04/2026',
        expenses: '40€ provisión de fondos (luz, agua, internet)',
        timeline: [
          { id: 'H1_MARIA_START', date: '01/08/2025', text: 'Inicio contrato: María Pérez Ruiz (+34 722 49 48 61). Renta 350€ + 39€ gastos.', type: 'contract' },
          { id: 'H1_MARIA_EXIT', date: '31/01/2026', text: 'Salida anticipada: María Pérez Ruiz (+34 722 49 48 61). Motivo: Enfermedad madre. Fianza devuelta.', type: 'departure' },
          { id: 'H1_ALEJANDRO_START', date: '01/02/2026', text: 'Inicio contrato (Pase de H4): Alejandro Fernández Vieites (+34 644 454 351). Renta 350€ + 40€ suministros. Fecha salida irrevocable: 31/03/2026. Pago novación: 490€.', type: 'contract' }
        ],
        tenant: {
          name: 'Alejandro Fernández Vieites',
          email: 'fernandezvieitesalejandro@gmail.com',
          phone: '+34 644 454 351',
          idNumber: '48706724S',
          startDate: '01/02/2026',
          endDate: '31/03/2026',
          deposit: 350
        },
        tenantHistory: [] // Ver historial completo en archivo Excel externo
      },
      {
        id: 'C_SALZILLO_2_PALMAR_H2',
        name: 'H2',
        price: 330,
        status: 'occupied',
        availableFrom: '30/04/2026',
        expenses: '39€ fijos',
        targetProfile: 'both',
        timeline: [
          { id: 'CS2_H2_ENTRY', date: '06/05/2025', text: 'Inicio contrato original: Kevin Holzmann (+34 670 10 25 42). Renta 330€ + 39€ gastos.', type: 'contract' },
          { id: 'CS2_H2_PRORROGA_1', date: '01/09/2025', text: '1ª Prórroga: Kevin Holzmann (+34 670 10 25 42) hasta 30/11/2025.', type: 'contract' },
          { id: 'CS2_H2_PRORROGA_2', date: '30/11/2025', text: '2ª Prórroga: Kevin Holzmann (+34 670 10 25 42) hasta 31/01/2026.', type: 'contract' },
          { id: 'CS2_H2_PRORROGA_3', date: '22/01/2026', text: '3ª Prórroga: Kevin Holzmann (+34 670 10 25 42) hasta 30/04/2026.', type: 'contract' }
        ],
        tenant: {
          name: 'Kevin Holzmann',
          email: '',
          phone: '+34670102542',
          idNumber: 'YB8679172',
          startDate: '01/02/2026',
          endDate: '30/04/2026',
          deposit: 330
        },
        tenantHistory: [] // Ver historial completo en archivo Excel externo
      },
      {
        id: 'C_SALZILLO_2_PALMAR_H3',
        name: 'H3',
        price: 260,
        status: 'occupied',
        availableFrom: '01/04/2026',
        expenses: '55€ fijos',
        targetProfile: 'both',
        timeline: [
          { id: 'CS2_H3_ENTRY', date: '12/12/2025', text: 'Inicio contrato: Littzy Ninfa Álvares Rodríguez (+34 610 75 35 88). Avalista: Wilson Iriarte Balderrama (+34 662 29 41 65). Renta 260€ + 55€ gastos.', type: 'contract' }
        ],
        notes: 'Avalista: Wilson Iriarte Balderrama (DNI 54564370K, +34 662 294 165)',
        tenant: {
          name: 'Littzy Ninfa Álvares Rodríguez',
          email: 'littzy12362@gmail.com',
          phone: '+34 610 753 588',
          idNumber: 'GE66613',
          startDate: '12/12/2025',
          endDate: '31/03/2026',
          deposit: 260
        }
      },
      {
        id: 'C_SALZILLO_2_PALMAR_H4',
        name: 'H4',
        price: 250,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: 'Gastos fijos aparte',
        targetProfile: 'both',
        timeline: [
          { id: 'H4_ALEJANDRO_EXIT', date: '31/01/2026', text: 'Alejandro Fernández Vieites (+34 644 454 351) traslada su estancia a H1 por anexo de novación.', type: 'departure' }
        ],
        tenantHistory: [
          {
            name: 'Alejandro Fernández Vieites',
            email: 'fernandezvieitesalejandro@gmail.com',
            phone: '+34 644 454 351',
            idNumber: '48706724S',
            startDate: '19/08/2025',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            exitReason: 'Pase a Habitación H1 (mejoras)',
            deposit: 250
          }
        ]
      },
    ]
  },
  {
    id: 'SANJOSE16',
    address: 'Calle San Jose 16',
    city: 'Murcia',
    image: '',
    googleMapsLink: getMapsLink('Calle San Jose 16, Murcia'),
    rooms: [
      {
        id: 'SANJOSE16_H1',
        name: 'H1',
        price: 325,
        status: 'occupied',
        availableFrom: '01/02/2027',
        expenses: '56€ fijos mensuales',
        targetProfile: 'students',
        tenant: {
          name: 'TATIANA VALLEJO CARRERA',
          email: '',
          phone: '+34 644 168 325',
          idNumber: 'Y8957838L',
          startDate: '14/07/2025',
          endDate: '01/02/2027',
          deposit: 325
        },
        timeline: [
          { id: 'SJ16_H1_START', date: '07/07/2025', text: 'Firma contrato: TATIANA VALLEJO. Financiado parcialmente por Fundación ST3.', type: 'contract' },
          { id: 'SJ16_H1_ENTRY', date: '14/07/2025', text: 'Inicio estancia y pago inicial prorrateado (221,22€ renta+gastos). Fianza previa 325€.', type: 'info' },
          { id: 'SJ16_H1_EXTENSION', date: '20/01/2026', text: 'Firma documento de prórroga: Hasta 01/02/2027. Renta 325€ + 56€ suministros.', type: 'contract' }
        ],
        notes: 'URGENTE: A principio de cada mes enviar el importe a pagar a la asociación (Fundación ST3) que paga el alquiler de Tatiana. Llamar al +34 633 81 34 34 para confirmar si el procedimiento sigue siendo el mismo o ha cambiado.'
      },
      {
        id: 'SANJOSE16_H2',
        name: 'H2',
        price: 315,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: '56€ fijos mensuales',
        targetProfile: 'students',
        tenant: {
          name: 'INGRID ROLLNERT ORTEGA',
          email: '',
          phone: '+34 692 707 318',
          idNumber: '74016459K',
          startDate: '01/09/2025',
          endDate: '30/06/2026',
          deposit: 315
        },
        timeline: [
          { id: 'SJ16_H2_START', date: '01/09/2025', text: 'Inicio contrato: INGRID ROLLNERT. Renta 315€ + 56€ gastos.', type: 'contract' },
          { id: 'SJ16_H2_EXTENSION', date: '20/01/2026', text: 'Firma documento de prórroga: Hasta 30/06/2026. Renta 315€ + 56€ suministros.', type: 'contract' }
        ]
      },
      {
        id: 'SANJOSE16_H3',
        name: 'H3',
        price: 325,
        status: 'occupied',
        availableFrom: '01/03/2026',
        expenses: '56€ fijos mensuales',
        targetProfile: 'students',
        tenant: {
          name: 'ADLANE HADDAD',
          email: '',
          phone: '+33 783 636 686',
          idNumber: '307696678',
          startDate: '31/07/2025',
          endDate: '01/03/2026',
          deposit: 325
        },
        timeline: [
          { id: 'SJ16_H3_START', date: '31/07/2025', text: 'Inicio contrato: ADLANE HADDAD. Renta 325€ + 56€ gastos.', type: 'contract' },
          { id: 'SJ16_H3_EXTENSION', date: '20/01/2026', text: 'Firma documento de prórroga: Hasta 01/03/2026. Renta 325€ + 56€ suministros.', type: 'contract' }
        ]
      },
      {
        id: 'SANJOSE16_H4',
        name: 'H4',
        price: 325,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: '56€ fijos mensuales',
        targetProfile: 'students',
        tenant: {
          name: 'JOSHUAR ALEXIS BRUZÓN VIDAL',
          email: '',
          phone: '+56 956 836 737',
          idNumber: 'Z2313416N',
          startDate: '31/07/2025',
          endDate: '30/06/2026',
          deposit: 325
        },
        timeline: [
          { id: 'SJ16_H4_START', date: '31/07/2025', text: 'Inicio contrato: JOSHUAR ALEXIS BRUZÓN. Renta 325€ + 56€ gastos.', type: 'contract' },
          { id: 'SJ16_H4_EXTENSION', date: '20/01/2026', text: 'Firma documento de prórroga: Hasta 30/06/2026. Renta 325€ + 56€ suministros.', type: 'contract' }
        ]
      },
      {
        id: 'SANJOSE16_H5',
        name: 'H5',
        price: 340,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: '56€ fijos mensuales',
        targetProfile: 'students',
        tenant: {
          name: 'INMACULADA GARCÍA SÁNCHEZ',
          email: '',
          phone: '+34 633 935 587',
          idNumber: '78128334W',
          startDate: '01/09/2025',
          endDate: '31/07/2026',
          deposit: 340
        },
        timeline: [
          { id: 'SJ16_H5_START', date: '18/07/2025', text: 'Firma contrato: INMACULADA GARCÍA SÁNCHEZ (Menor). Representante: Inmaculada Sánchez Callado (53142753B).', type: 'contract' },
          { id: 'SJ16_H5_ENTRY', date: '01/09/2025', text: 'Inicio estancia y pago inicial (340€ renta + 56€ suministros). Fianza 340€ depositada.', type: 'info' }
        ],
        notes: 'Inquilina menor de edad. Representante legal: Inmaculada de la Encarnación Sánchez Callado (DNI 53142753B).'
      },
    ]
  },
  {
    id: 'GUILLAMON27',
    address: 'C. Antonio Flores Guillamón, 27',
    city: 'Espinardo (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('C. Antonio Flores Guillamón, 27, Espinardo, Murcia'),
    managementCommission: 13,
    commissionIncludesIVA: false,
    ownerName: 'Gianfranco y Paulo Gazzaniga',
    ownerPhone: '(Pendiente indicar)',
    cleaningConfig: {
      enabled: true,
      cleanerName: 'Luisa Hernández',
      cleanerPhone: '+34 624 99 00 64',
      costPerHour: 10,
      days: [],
      hours: '',
      included: false,
      notes: 'Productos aportados por propietarios/inquilinos.'
    },
    internalNotes: 'Ref Catastral: 2289405XH6028N0002UU. Propietarios: Gianfranco (pendiente indicar teléfono) y Paulo (pendiente indicar teléfono) Gazzaniga. El inquilino Alberto (+34 601 644 054) (H4) tiene como avalista solidario a Juan Carlos Rodríguez García (pendiente indicar teléfono) (DNI 23249398D). PROTOCOLO FIRMA: Paulo (pendiente indicar teléfono) firma digital. Una vez firmado por todos, pasar PDF a su hermano (Gianfranco - pendiente indicar teléfono) para firma manual/normal (no le llegan/lee los de firma digital). LLAVES: Buzón en zona común. Cada inquilino tiene llave de arriba, abajo y habitación. Pol (+34 672 88 63 69) NO tiene llaves. PENDIENTE: Consultar a Víctor (pendiente indicar teléfono)/Ayoub (pendiente indicar teléfono) si tienen copias de habitaciones. COMUNIDAD: Proyecto de adaptación energética aprobado (fachada, escalera, placas solares). Ya han hecho catas. Pendiente inicio obras. LIMPIEZA: Luisa Hernández (+34 624 99 00 64). Cobra 10€/h. Productos aportados por propietarios/inquilinos.',
    timeline: [
      { id: 'GUI27_ALBERTO_MOVE', date: '01/02/2026', text: 'Alberto (+34 601 644 054) se traslada de H1 a H4 según contrato de 25/01/2026', type: 'info' },
      { id: 'GUI27_BATH_LOCK_INCIDENT', date: '03/02/2026', text: 'INCIDENCIA (14:19): Cerradura del baño rota. Solicitado vídeo de prueba. Notificado a propietarios (pendiente indicar teléfono). En espera de autorización para reparación.', type: 'incident' },
      { id: 'GUI27_LOCK_REPAIR_ASSIGN', date: '03/02/2026', text: 'REPARACIÓN CERRADURA: Asignada tarea a Carlos (técnico +34 680 94 84 36). Enviado vídeo. Presupuesto: 55€ + materiales. Paulo (pendiente indicar teléfono) ACEPTA presupuesto.', type: 'maintenance' },
      { id: 'GUI27_H1_CONTRACT_SIGN', date: '04/02/2026', text: 'NUEVO CONTRATO H1: Jose Eduardo Hurtado Pinto (+34 623 60 53 75). Iniciado protocolo de firma (Paulo -> Gianfranco manual) (ambos pendiente indicar teléfono).', type: 'contract' },
      { id: 'GUI27_COMMUNITY_UPDATE', date: '03/02/2026', text: 'INFO COMUNIDAD: Proyecto adaptación energética aprobado (fachada, escalera, placas). Catas realizadas. Obras no iniciadas aún.', type: 'info' }
    ],
    rooms: [
      {
        id: 'GUILLAMON27_H1',
        name: 'H1',
        price: 340,
        status: 'occupied',
        availableFrom: '04/02/2027',
        expenses: 'Se reparten los gastos reales entre inquilinos',
        commissionValue: 13,
        driveUrl: 'https://drive.google.com/drive/folders/1FPzfvahnjlwXOZunP8I4vCh331hoo_D4?usp=sharing',
        notes: 'Equipada con AC, nevera propia y balcón privado.',
        timeline: [
          { id: 'GUI27_H1_EXIT', date: '31/01/2026', text: 'Alberto (+34 601 644 054) finaliza estancia en H1. Se traslada a H4 (mismo edificio).', type: 'departure' },
          { id: 'GUI27_H1_ENTRY', date: '04/02/2026', text: 'Jose Eduardo (+34 623 60 53 75) inicia contrato H1 (340€). Pago inicial: 643,57€ (Renta + Fianza).', type: 'contract' }
        ],
        tenant: {
          name: 'Jose Eduardo Hurtado Pinto',
          email: 'hurtadoeduardo59@gmail.com',
          phone: '+34 623 60 53 75',
          idNumber: '48746814Q',
          startDate: '04/02/2026',
          endDate: '04/02/2027',
          deposit: 340
        },
        tenantHistory: [
          {
            name: 'ALBERTO RODRÍGUEZ DÍAZ',
            email: '',
            phone: '+34 601 644 054',
            idNumber: '52041527W',
            startDate: '25/01/2026',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            exitReason: 'Cambio a H4 (Renta 250€)',
            deposit: 0
          },
          {
            name: 'Yara Fernanda Muñiz Limones',
            email: '',
            phone: '+528267699529',
            idNumber: 'PAS N18611570',
            startDate: '01/09/2025',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            exitReason: 'Finalización de contrato temporal (estudios)',
            deposit: 340
          }
        ]
      },
      {
        id: 'GUILLAMON27_H2',
        name: 'H2',
        price: 270,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Se reparten los gastos reales entre inquilinos',
        commissionValue: 13,
        timeline: [
          { id: 'GUI27_H2_ENTRY', date: '01/09/2025', text: 'Inicio contrato: Tyrone Diego Wils (+34 672 58 64 88). Renta 270€ + gastos reales.', type: 'contract' }
        ],
        tenant: {
          name: 'Tyrone Diego Wils',
          email: '',
          phone: '+34 672 58 64 88',
          idNumber: 'Y6535417-G',
          startDate: '01/09/2025',
          endDate: '30/06/2026',
          deposit: 270
        }
      },
      {
        id: 'GUILLAMON27_H3',
        name: 'H3',
        price: 270,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Se reparten los gastos reales entre inquilinos',
        commissionValue: 13,
        timeline: [
          { id: 'GUI27_H3_ENTRY', date: '01/09/2025', text: 'Inicio contrato: Sergio Martínez Hernández (+34 633 42 10 36). Nota: Contrato firmado por su padre Pedro Mariano Martínez García por ser menor al inicio (DNI Sergio 492244775).', type: 'contract' }
        ],
        tenant: {
          name: 'Sergio Martínez Hernández',
          email: '',
          phone: '+34 633 42 10 36',
          idNumber: '492244775',
          startDate: '01/09/2025',
          endDate: '30/06/2026',
          deposit: 270
        }
      },
      {
        id: 'GUILLAMON27_H4',
        name: 'H4',
        price: 250,
        status: 'occupied',
        availableFrom: '30/06/2026',
        expenses: 'Se reparten los gastos reales entre inquilinos',
        commissionValue: 13,
        timeline: [
          { id: 'GUI27_H4_ENTRY', date: '01/02/2026', text: 'Alberto (+34 601 644 054) inicia contrato en H4 (250€). Avalista: Juan Carlos Rodríguez (pendiente indicar teléfono).', type: 'contract' }
        ],
        tenant: {
          name: 'ALBERTO RODRÍGUEZ DÍAZ',
          email: '',
          phone: '+34 601 644 054',
          idNumber: '52041527W',
          startDate: '01/02/2026',
          endDate: '30/06/2026',
          deposit: 250
        },
        tenantHistory: [
          {
            name: 'IRENE GOVONI',
            email: '',
            phone: '+39 327 443 1178',
            idNumber: 'ITA CA93089MO',
            startDate: '05/09/2025',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            exitReason: 'Finalización de contrato temporal',
            deposit: 250
          }
        ]
      },
    ]
  },
  {
    id: 'SANMARCOS21',
    address: 'Calle San Marcos 21',
    city: 'Barrio del Carmen (Murcia)',
    floor: '5º D',
    image: '',
    managementCommission: 13,
    commissionIncludesIVA: false,
    ownerName: 'Rosario (Propietaria)',
    ownerPhone: '(Pendiente indicar)',
    internalNotes: 'Ref Catastral: 7040903XH5074A0004XH. Rosario (+34 pendiente). 27/1/2025: Llaves entregadas al técnico Carlos (+34 680 94 84 36) para presupuestar puesta a punto. Protocolo: Notificar cambios en grupo WhatsApp (Propietaria, Carlos, Rentia).',
    timeline: [
      {
        id: 'evt_sm21_keys_carlos',
        date: '27/01/2025',
        type: 'maintenance',
        text: 'Entrega de llaves al técnico Carlos (+34 680 94 84 36) para presupuestar reformas. Comunicación vía grupo WhatsApp.'
      },
      {
        id: 'SM21_H3_H5_EXIT_PENDING',
        date: '03/02/2026',
        type: 'info',
        text: 'PENDIENTE: Mandar documentos de salida H3 y H5 y solicitar número de cuenta para devolución de fianza.'
      },
      {
        id: 'SM21_AYOUB_REVIEW',
        date: '03/02/2026',
        type: 'maintenance',
        text: 'Ayoub (pendiente indicar teléfono) revisará el estado de las habitaciones H3 y H5.'
      },
      {
        id: 'SM21_SHOWER_INCIDENT',
        date: '03/02/2026',
        type: 'incident',
        text: 'INCIDENCIA PLATO DUCHA: Ayoub (pendiente indicar teléfono) visita la vivienda con el técnico para presupuestar cambio de plato de ducha y con el perito para valorar daños. También en contacto con el vecino de abajo. Pendiente mandar presupuesto a la propietaria Rosario (pendiente indicar teléfono).'
      }
    ],
    googleMapsLink: getMapsLink('Calle San Marcos 21, Barrio del Carmen, Murcia'),
    rooms: [
      { id: 'SANMARCOS21_H1', name: 'H1', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      {
        id: 'SANMARCOS21_H2',
        name: 'H2',
        price: 340,
        status: 'occupied',
        availableFrom: '31/03/2026',
        expenses: '60€ fijos mensuales',
        targetProfile: 'both',
        tenant: {
          name: 'JONA ELIE MEIKE VINCENTZ',
          email: '',
          phone: '+49 1525 1028 259',
          idNumber: 'L22N2X0PM',
          startDate: '01/09/2025',
          endDate: '31/03/2026',
          deposit: 340
        },
        timeline: [
          { id: 'SJ21_H2_START', date: '05/08/2025', text: 'Firma contrato: JONA ELIE MEIKE. Renta 340€ + 60€ suministros.', type: 'contract' },
          { id: 'SJ21_H2_ENTRY', date: '01/09/2025', text: 'Inicio estancia y pago inicial (340€ renta + 60€ suministros). Fianza 340€.', type: 'info' }
        ]
      },
      {
        id: 'SANMARCOS21_H3',
        name: 'H3',
        price: 280,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: '50€ fijos mensuales',
        targetProfile: 'both',
        timeline: [
          { id: 'SM21_H3_START', date: '07/08/2025', text: 'Firma contrato: ALESSIO CINTI. Renta 280€ + 50€ gastos.', type: 'contract' },
          { id: 'SM21_H3_ENTRY', date: '03/09/2025', text: 'Inicio estancia y primer pago prorrateado (308,09€ total: 261,33€ renta + 46,76€ gastos). Fianza 280€.', type: 'info' },
          { id: 'SM21_H3_EXIT_CONFIRMED', date: '31/01/2026', text: 'Fin de estancia: Alessio Cinti. Habitación disponible.', type: 'departure' }
        ],
        tenantHistory: [
          {
            name: 'ALESSIO CINTI',
            email: '',
            phone: '+39 392 507 0287',
            idNumber: 'CA52170WF',
            startDate: '03/09/2025',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            deposit: 280
          }
        ]
      },
      {
        id: 'SANMARCOS21_H4',
        name: 'H4',
        price: 250,
        status: 'occupied',
        availableFrom: '31/05/2026',
        expenses: '50€ fijos mensuales',
        targetProfile: 'both',
        tenant: {
          name: 'ANTOINE JOACHIM MUR',
          email: 'antoinemur65@gmail.com',
          phone: '+33 607 870 767',
          idNumber: '19AD65337',
          startDate: '29/09/2025',
          endDate: '31/05/2026',
          deposit: 250
        },
        timeline: [
          { id: 'SM21_H4_START', date: '25/09/2025', text: 'Firma contrato: ANTOINE JOACHIM MUR. Renta 250€ + 50€ gastos.', type: 'contract' },
          { id: 'SM21_H4_ENTRY', date: '29/09/2025', text: 'Inicio estancia y pago inicial prorrateado (20,00€ total: 16,67€ renta + 3,33€ gastos). Fianza 250€.', type: 'info' }
        ]
      },
      {
        id: 'SANMARCOS21_H5',
        name: 'H5',
        price: 340,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: '60€ fijos mensuales',
        targetProfile: 'both',
        timeline: [
          { id: 'SM21_H5_START', date: '08/08/2025', text: 'Firma contrato: ANDREA MALLONI. Renta 340€ + 60€ gastos.', type: 'contract' },
          { id: 'SM21_H5_ENTRY', date: '03/09/2025', text: 'Inicio estancia y pago inicial prorrateado (373,33€ total: 317,33€ renta + 56,00€ gastos). Fianza 340€.', type: 'info' },
          { id: 'SM21_H5_EXIT_CONFIRMED', date: '31/01/2026', text: 'Fin de estancia: Andrea Malloni. Habitación disponible.', type: 'departure' }
        ],
        tenantHistory: [
          {
            name: 'ANDREA MALLONI',
            email: '',
            phone: '+39 366 700 9283',
            idNumber: 'CA77321PQ',
            startDate: '03/09/2025',
            endDate: '31/01/2026',
            exitDate: '31/01/2026',
            deposit: 340
          }
        ]
      },
    ]
  },
  {
    id: 'SANMARCOS21_7D',
    address: 'Calle San Marcos 21',
    city: 'Barrio del Carmen (Murcia)',
    floor: '7º D',
    image: '',
    managementCommission: 13,
    commissionIncludesIVA: false,
    ownerName: 'Rosario (Propietaria)',
    ownerPhone: '+34 672 44 96 03',
    googleMapsLink: getMapsLink('Calle San Marcos 21, Barrio del Carmen, Murcia'),
    internalNotes: 'Técnico coordinando reforma: Carlos (+34 680 94 84 36). PENDIENTE: Coordinar con él, fotos y lanzamiento. PROBLEMA: Copias de seguridad llaves portal abajo (preguntar situación a propietaria). PRECIOS: En negociación (ver timeline).',
    timeline: [
      { id: 'SM21_7D_REFORM', date: '04/02/2026', text: 'En fase final de reforma. Coordinando con Carlos (+34 680 94 84 36). Pendiente sesión fotos y aprobar precios finales.', type: 'incident' },
      { id: 'SM21_7D_KEYS_ISSUE', date: '04/02/2026', text: 'PENDIENTE: Preguntar a Rosario situación llaves portal (problemas copias).', type: 'info' }
    ],
    rooms: [
      { id: 'SANMARCOS21_7D_H1', name: 'H1', price: 240, status: 'available', availableFrom: 'Post-Reforma', expenses: 'Gastos fijos aparte', targetProfile: 'both', notes: 'Fondo cerca de la cocina' },
      { id: 'SANMARCOS21_7D_H2', name: 'H2', price: 250, status: 'available', availableFrom: 'Post-Reforma', expenses: 'Gastos fijos aparte', targetProfile: 'both', notes: 'Cocina (un pelín más grande)' },
      { id: 'SANMARCOS21_7D_H3', name: 'H3', price: 260, status: 'available', availableFrom: 'Post-Reforma', expenses: 'Gastos fijos aparte', targetProfile: 'both', notes: 'Corredor (más grande)' },
      { id: 'SANMARCOS21_7D_H4', name: 'H4', price: 270, status: 'available', availableFrom: 'Post-Reforma', expenses: 'Gastos fijos aparte', targetProfile: 'both', notes: 'Fondo' },
      { id: 'SANMARCOS21_7D_H5', name: 'H5', price: 0, status: 'available', availableFrom: 'Post-Reforma', expenses: 'Gastos fijos aparte', targetProfile: 'both', notes: 'Grande de frente (Precio pendiente aprobar)' },
      { id: 'SANMARCOS21_7D_H6', name: 'H6', price: 0, status: 'available', availableFrom: 'Post-Reforma', expenses: 'Gastos fijos aparte', targetProfile: 'both', notes: 'Suite con cocinita, balcón y baño privado (Precio pendiente aprobar)' },
    ]
  },
  {
    id: 'SANTARITA2',
    address: 'Calle Santa Rita 2',
    city: 'Patiño (Murcia)',
    floor: '4º B',
    image: '',
    bathrooms: 1,
    ownerName: 'Grup Talaku 2013 S.L. (Nieves Rubau)',
    googleMapsLink: getMapsLink('Calle Santa Rita 2, Patiño, Murcia'),
    rooms: [
      {
        id: 'SANTARITA2_H1',
        name: 'H1',
        price: 350,
        status: 'occupied',
        availableFrom: '31/03/2026',
        expenses: 'Gastos de suministros compartidos',
        targetProfile: 'both',
        tenant: {
          name: 'VÍT MAKÁSEK',
          email: 'vmakasek@gmail.com',
          phone: '+420 776 172 621',
          idNumber: '213338389',
          startDate: '14/12/2025',
          endDate: '31/03/2026',
          deposit: 350,
          secondTenant: {
            name: 'HERNÁN DARÍO MEJÍA BENITEZ',
            idNumber: 'BC661166',
            email: 'hernanmadridoficial@gmail.com',
            phone: '+34 603 229 608'
          }
        },
        timeline: [
          { id: 'SR2_H1_START', date: '14/12/2025', text: 'Firma contrato: Vít Makásek y Hernán Darío Mejía. Renta 350€ + suministros.', type: 'contract' },
          { id: 'SR2_H1_ENTRY', date: '14/12/2025', text: 'Inicio estancia y pago inicial (553,22€ total: 203,22€ renta prorrateada + 350,00€ fianza).', type: 'info' }
        ]
      },
      {
        id: 'SANTARITA2_H2',
        name: 'H2',
        price: 270,
        status: 'occupied',
        availableFrom: '01/03/2026',
        expenses: 'Gastos de suministros compartidos',
        targetProfile: 'both',
        tenant: {
          name: 'AHMED SINE',
          email: '',
          phone: '+212 640-899041',
          idNumber: 'EZ9192683',
          startDate: '04/12/2025',
          endDate: '01/03/2026',
          deposit: 270
        },
        timeline: [
          { id: 'SR2_H2_START', date: '03/12/2025', text: 'Firma contrato: Ahmed Sine. Avalista: Hicham Lyagoubi (NIE X2904871V). Renta 270€ + suministros.', type: 'contract' },
          { id: 'SR2_H2_ENTRY', date: '04/12/2025', text: 'Inicio estancia y pago inicial (513,87€ total: 243,87€ renta prorrateada + 270,00€ fianza).', type: 'info' }
        ]
      },
      {
        id: 'SANTARITA2_H3',
        name: 'H3',
        price: 230,
        status: 'occupied',
        availableFrom: '01/03/2026',
        expenses: 'Gastos de suministros compartidos',
        targetProfile: 'both',
        tenant: {
          name: 'MARIA MOLINA GOMEZ',
          email: '',
          phone: '+34 698 20 26 90',
          idNumber: '04855201Q',
          startDate: '05/12/2025',
          endDate: '01/03/2026',
          deposit: 230
        },
        timeline: [
          { id: 'SR2_H3_START', date: '03/12/2025', text: 'Firma contrato: Maria Molina Gomez. Renta 230€ + suministros.', type: 'contract' },
          { id: 'SR2_H3_ENTRY', date: '05/12/2025', text: 'Inicio estancia y pago inicial (430,32€ total: 200,32€ renta prorrateada + 230,00€ fianza).', type: 'info' }
        ]
      },
      {
        id: 'SANTARITA2_H4',
        name: 'H4',
        price: 210,
        status: 'occupied',
        availableFrom: '31/03/2026',
        expenses: 'Gastos de suministros compartidos',
        targetProfile: 'both',
        tenant: {
          name: 'DARÍO DAVID GODOY',
          email: 'ddgirasoqui@gmail.com',
          phone: '+34 650 920 533',
          idNumber: 'AAL906620',
          startDate: '17/12/2025',
          endDate: '31/03/2026',
          deposit: 210
        },
        timeline: [
          { id: 'SR2_H4_START', date: '17/12/2025', text: 'Firma contrato: Darío David Godoy. Renta 210€ + suministros.', type: 'contract' },
          { id: 'SR2_H4_ENTRY', date: '17/12/2025', text: 'Inicio estancia y pago inicial (311,55€ total: 101,55€ renta prorrateada + 210,00€ fianza).', type: 'info' }
        ]
      },
    ]
  },
  {
    id: 'ARCIPRESTE',
    address: 'C/ Arcipreste Mariano Aroca 4',
    city: 'Barrio del Carmen (Murcia)',
    floor: '4º A',
    image: '',
    googleMapsLink: getMapsLink('C/ Arcipreste Mariano Aroca 4, Barrio del Carmen, Murcia'),
    managementCommission: 13,
    commissionIncludesIVA: false,
    bankAccount: 'ES26 2100 2190 9202 0050 8776',
    bankAccountHolder: 'Paulo Dino Gazzaniga',
    paymentFlow: 'tenant_rentia_owner',
    transferDay: 20,
    internalNotes: 'Ref Catastral: 4651205XH6045S0013JE. Propietario: Paulo Dino Gazzaniga (NIE Y-0530543-Q, +34 647 88 04 49). Domicilio: C/ Venezuela 3, 04230, Huércal de Almería. Contrato Gestión firmado 01/12/2025 (13% + IVA). Liquidación día 20 mes en curso. PENDIENTE: Regularizar contratos (piso traspasado de Alquilofacil sin documentación al día). Intentando contactar con inquilinos hoy 03/02/26. Protocolo: Se reparten excedentes de suministros si superan 40€/hab.',
    timeline: [
      { id: 'ARC_TENANT_SEARCH_2026', date: '03/02/2026', text: 'ESTADO CONTRATOS: Sandra no pudo ponerlo al día tras el traspaso de Alquilofacil. Se busca documentación actualizada. Iniciado contacto directo con inquilinos para regularizar.', type: 'incident' },
      { id: 'ARC_MGMT_CONTRACT', date: '01/12/2025', text: 'Firmado nuevo Contrato de Gestión Integral (13% + IVA). Propietario: Paulo Dino Gazzaniga.', type: 'contract' }
    ],
    rooms: [
      {
        id: 'ARCIPRESTE_H1',
        name: 'H1',
        price: 340,
        status: 'occupied',
        availableFrom: 'En Regularización',
        expenses: 'Incluye 40€ (30€ luz + 10€ agua)',
        targetProfile: 'workers',
        specialStatus: 'renovation',
        notes: 'CONTRATO ANTIGUO (Alquilofacil). Pendiente regularizar documentación y nueva firma tras traspaso.',
        commissionValue: 13,
        tenant: {
          name: 'Jesus Gabriel Castillo Lugo',
          email: 'jesusgcastillol2000@gmail.com',
          phone: '+34 656198438',
          idNumber: 'PAS 191456392',
          startDate: '14/11/2024',
          endDate: '14/11/2025',
          deposit: 300
        },
        timeline: [
          { id: 'ARC_H1_CONTRACT', date: '14/11/2024', text: 'Inicio contrato: Jesus Gabriel Castillo Lugo. Aval: Alexander Alberto Da Silva (+34 612 244 123). Renta 340€, Fianza 300€.', type: 'contract' }
        ]
      },
      {
        id: 'ARCIPRESTE_H2',
        name: 'H2',
        price: 390,
        status: 'occupied',
        availableFrom: 'En Regularización',
        expenses: 'Incluye 50€ (35€ luz + 15€ agua)',
        targetProfile: 'workers',
        specialStatus: 'renovation',
        notes: 'CONTRATO ANTIGUO (Alquilofacil). Pendiente regularizar documentación y nueva firma tras traspaso.',
        commissionValue: 13,
        tenant: {
          name: 'Lady Alejandra Triviño Amesquita',
          email: 'ladyt6911@gmail.com',
          phone: '+57 3103565661',
          idNumber: 'PAS BE-578861',
          startDate: '25/11/2024',
          endDate: '25/11/2025',
          deposit: 340,
          secondTenant: {
            name: 'Jaime Daniel Triviño Amesquita',
            idNumber: 'PAS BF-229894',
            email: 'jaimetrivn78@gmail.com',
            phone: '+57 3202048961'
          }
        },
        timeline: [
          { id: 'ARC_H2_CONTRACT', date: '25/11/2024', text: 'Inicio contrato: Lady Alejandra y Jaime Daniel. Aval: Miguel Angel Orellana (+34 636 961 520). Renta 390€, Fianza 340€.', type: 'contract' }
        ]
      },
      {
        id: 'ARCIPRESTE_H3',
        name: 'H3',
        price: 250,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: '50€ fijos',
        targetProfile: 'workers',
        commissionValue: 13,
        notes: 'DISPONIBLE PARA ANUNCIAR. Individual. LLAVES: Hugo (+34 663 89 16 44) tiene la llave física. Coordinar entrega con él.'
      },
      {
        id: 'ARCIPRESTE_H4',
        name: 'H4',
        price: 330,
        status: 'occupied',
        availableFrom: 'En Regularización',
        expenses: 'Incluye 40€ (30€ luz + 10€ agua)',
        targetProfile: 'workers',
        specialStatus: 'renovation',
        notes: 'CONTRATO ANTIGUO (Alquilofacil). Pendiente regularizar documentación y nueva firma tras traspaso.',
        commissionValue: 13,
        tenant: {
          name: 'Steven Daniel Celis Chacon',
          email: 'stevendanielcelis85@gmail.com',
          phone: '+34 652 556 195',
          idNumber: 'PAS 194163174',
          startDate: '16/12/2024',
          endDate: '16/12/2025',
          deposit: 290
        },
        timeline: [
          { id: 'ARC_H4_CONTRACT', date: '16/12/2024', text: 'Inicio contrato: Steven Daniel Celis. Aval: Joseph Andres Romero (+34 632 792 924). Renta 330€, Fianza 290€.', type: 'contract' }
        ]
      },
    ]
  },
  {
    id: 'MAYOR',
    address: 'Calle Mayor 5',
    city: 'Alcantarilla (Murcia)',
    image: '',
    bathrooms: 2,
    googleMapsLink: getMapsLink('Calle Mayor 5, Alcantarilla, Murcia'),
    managementCommission: 13,
    commissionIncludesIVA: false,
    internalNotes: 'Propietario: Paulo Gazzaniga (pendiente indicar teléfono). Vicente (Potencias) gestionando trámites ante Industria.',
    timeline: [
      { id: 'MAYOR_POWER_DOCS', date: '03/02/2026', text: 'Vicente (Potencias - pendiente indicar teléfono) envía documentos para firma de Paulo (pendiente indicar teléfono). Pol (+34 672 88 63 69) se los reenvía a Paulo a las 16:24 para tramitar ante Industria.', type: 'info' }
    ],
    rooms: [
      { id: 'MAYOR_H1', name: 'H1', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Mediana. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
      { id: 'MAYOR_H2', name: 'H2', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Grande. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
      { id: 'MAYOR_H3', name: 'H3', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Mediana. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
      { id: 'MAYOR_H4', name: 'H4', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Mediana. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
      { id: 'MAYOR_H5', name: 'H5', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Grande. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
      { id: 'MAYOR_H6', name: 'H6', price: 230, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Pequeña. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
      { id: 'MAYOR_H7', name: 'H7', price: 230, status: 'available', availableFrom: 'Inmediata', expenses: '56€ fijos', targetProfile: 'both', specialStatus: 'new', notes: 'Pequeña. Suministros incluyen Luz, Agua, Internet. Butano (bombonas) a repartir entre todos.', commissionValue: 13 },
    ]
  },
  {
    id: 'JESUSQUESADA',
    address: 'Calle Jesús Quesada 12, 3º B',
    city: 'Murcia',
    image: '',
    bathrooms: 1,
    ownerName: 'Alejandro Gomez Galindo',
    ownerPhone: '+34 685 615 109',
    googleMapsLink: getMapsLink('Calle Jesús Quesada 12, Murcia'),
    internalNotes: 'Ref Catastral: 3462502XH6036S0034FI. Propietario: Alejandro Gomez Galindo (Avenida de los toreros 26, 4 E, 28028, Salamanca).',
    timeline: [
      { id: 'JQ12_H1_CONTRACT', date: '19/12/2025', text: 'Inicio contrato H1: Zakariae Bachar. Renta 250€ + 50€ suministros. Pago inicial prorrateado: 354,78€.', type: 'contract' },
      { id: 'JQ12_H2_CONTRACT', date: '22/12/2025', text: 'Inicio contrato H2: AJIL YOUSSEF. Renta 250€ + 50€ suministros. Pago inicial prorrateado: 346,70€.', type: 'contract' }
    ],
    rooms: [
      {
        id: 'JESUSQUESADA_H1',
        name: 'H1',
        price: 250,
        status: 'occupied',
        availableFrom: '28/02/2026',
        expenses: '50€ fijos',
        tenant: {
          name: 'Zakariae Bachar',
          email: 'bacharzakariae@gmail.com',
          phone: '+34 622 635 972',
          idNumber: 'Z-2646265-M',
          startDate: '19/12/2025',
          endDate: '28/02/2026',
          deposit: 250
        },
        timeline: [
          { id: 'H1_ZAKARIAE_ENTRY', date: '19/12/2025', text: 'Entrada inquilino: Zakariae Bachar. Contrato hasta 28/02/2026.', type: 'contract' }
        ]
      },
      {
        id: 'JESUSQUESADA_H2',
        name: 'H2',
        price: 250,
        status: 'occupied',
        availableFrom: '31/12/2026',
        expenses: '50€ fijos',
        tenant: {
          name: 'AJIL YOUSSEF',
          email: 'ajil.youssef2016@gmail.com',
          phone: '+212 689 230337',
          idNumber: 'EP0148103',
          startDate: '22/12/2025',
          endDate: '31/12/2026',
          deposit: 250
        },
        timeline: [
          { id: 'H2_AJIL_ENTRY', date: '22/12/2025', text: 'Entrada inquilino: AJIL YOUSSEF. Contrato hasta 31/12/2026.', type: 'contract' }
        ]
      },
      { id: 'JESUSQUESADA_H3', name: 'H3', price: 0, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', notes: 'Precio pendiente' },
      { id: 'JESUSQUESADA_H4', name: 'H4', price: 270, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'ASUNCION51',
    address: 'Calle Asunción 51',
    city: 'Molina de Segura',
    floor: '2º Izquierda',
    image: '',
    bathrooms: 1,
    googleMapsLink: getMapsLink('Calle Asunción 51, Molina de Segura'),
    internalNotes: 'Ref Catastral: 7036101XH5173E0005FK. Propietario: Santiago Galofré Romero Acuña (DNI 38881873M) (C/ Esplai 4, 08349, Cabrera de Mar). Seguro: Pendiente.',
    suppliesConfig: {
      type: 'fixed',
      fixedAmount: 50
    },
    paymentFlow: 'tenant_rentia_owner',
    managementCommission: 15,
    timeline: [
      { id: 'AS51_H2_CONTRACT', date: '03/02/2026', text: 'Firmado contrato H2: JOSE LUIS MENDEZ VIA. Pago inicial de 528,56€ (Fianza 250€ + Alquiler prop. 232,14€ + Suministros prop. 46,42€).', type: 'contract' }
    ],
    rooms: [
      {
        id: 'ASUNCION51_H1',
        name: 'H1',
        price: 250,
        status: 'available',
        availableFrom: 'Inmediata',
        expenses: '50€ fijos',
        commissionValue: 15
      },
      {
        id: 'ASUNCION51_H2',
        name: 'H2',
        price: 250,
        status: 'occupied',
        availableFrom: '03/02/2027',
        expenses: '50€ fijos (Suministros)',
        commissionValue: 15,
        timeline: [
          { id: 'AS51_H2_START', date: '03/02/2026', text: 'Inicio contrato: JOSE LUIS MENDEZ VIA (+34 613 952 479). Renta 250€ + 50€ suministros. Fianza 250€.', type: 'contract' }
        ],
        tenant: {
          name: 'JOSE LUIS MENDEZ VIA',
          idNumber: '20209991Y',
          email: 'mena.mym@gmail.com',
          phone: '+34 613 952 479',
          startDate: '03/02/2026',
          endDate: '03/02/2027',
          deposit: 250
        }
      },
      { id: 'ASUNCION51_H3', name: 'H3', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: '50€ fijos' },
      { id: 'ASUNCION51_H4', name: 'H4', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: '50€ fijos', commissionValue: 15 },
    ]
  },
  {
    id: 'SANGINES14',
    address: 'Plaza San Ginés 14',
    city: 'Murcia (Centro)',
    floor: '1º Izq y Der',
    image: '',
    googleMapsLink: getMapsLink('Plaza San Ginés 14, Murcia'),
    ownerName: 'Paulo Dino Gazzaniga',
    bankAccount: 'ES29 3058 0351 6227 2001 6478',
    bankAccountHolder: 'RENTIA INVESTMENTS S.L.',
    paymentFlow: 'tenant_rentia_owner',
    internalNotes: 'Ref Catastrales: 3760205XH6036S0001JU (Der) y 3760205XH6036S0002KI (Izq). Propietario: Paulo Dino Gazzaniga (NIE Y0530543Q, Calle Venezuela 3, Huércal de Almería). Gestión por Rentia.',
    timeline: [
      { id: 'SGINES_MGMT', date: '02/07/2025', text: 'Inicio gestión y firma de contratos para el curso 2025-2026.', type: 'info' }
    ],
    rooms: [
      {
        id: 'SANGINES14_H1',
        name: 'H1',
        price: 280,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: '56€ fijos',
        targetProfile: 'students',
        tenant: {
          name: 'JOAQUIN OSCAR HUAMANI TELLO',
          email: '',
          phone: '+51 954 158 830',
          idNumber: 'L42841223',
          startDate: '11/09/2025',
          endDate: '31/07/2026',
          deposit: 280
        },
        timeline: [
          { id: 'SGINES_H1_START', date: '02/07/2025', text: 'Firma contrato: Joaquin Oscar Huamani Tello. Renta 280€ + 56€ gastos.', type: 'contract' },
          { id: 'SGINES_H1_ENTRY', date: '11/09/2025', text: 'Inicio estancia (renovación de posesión según contrato).', type: 'info' }
        ]
      },
      {
        id: 'SANGINES14_H2',
        name: 'H2',
        price: 250,
        status: 'occupied',
        availableFrom: '31/03/2026',
        expenses: '56€ fijos',
        targetProfile: 'students',
        tenant: {
          name: 'GIULIA GERMONI',
          email: '',
          phone: '+39 371 429 7777',
          idNumber: 'Y-7028534-R',
          startDate: '01/01/2026',
          endDate: '31/03/2026',
          deposit: 250
        },
        timeline: [
          { id: 'SGINES_H2_ORIGINAL', date: '05/01/2025', text: 'Inicio contrato original: Giulia Germoni.', type: 'contract' },
          { id: 'SGINES_H2_EXT1', date: '01/04/2025', text: 'Primera prórroga hasta 30/06/2025.', type: 'contract' },
          { id: 'SGINES_H2_EXT2', date: '01/07/2025', text: 'Segunda prórroga hasta 31/12/2025.', type: 'contract' },
          { id: 'SGINES_H2_EXT3', date: '31/12/2025', text: 'Tercera prórroga: 01/01/2026 al 31/03/2026. Renta 250€ + 56€ gastos.', type: 'contract' }
        ]
      },
      {
        id: 'SANGINES14_H3',
        name: 'H3',
        price: 264,
        status: 'occupied',
        availableFrom: '31/05/2026',
        expenses: '56€ fijos',
        targetProfile: 'students',
        tenant: {
          name: 'CLAUDIO GERMONI',
          email: '',
          phone: '+39 334 79 38 721',
          idNumber: 'CA81081NY',
          startDate: '01/01/2026',
          endDate: '31/05/2026',
          deposit: 264
        },
        timeline: [
          { id: 'SGINES_H3_ORIGINAL', date: '01/09/2024', text: 'Inicio contrato original: Claudio Germoni.', type: 'contract' },
          { id: 'SGINES_H3_EXT1', date: '01/07/2025', text: 'Primera prórroga hasta 31/08/2025.', type: 'contract' },
          { id: 'SGINES_H3_EXT2', date: '01/09/2025', text: 'Segunda prórroga hasta 31/12/2025.', type: 'contract' },
          { id: 'SGINES_H3_EXT3', date: '31/12/2025', text: 'Tercera prórroga: 01/01/2026 al 31/05/2026. Renta 264€ + 56€ gastos.', type: 'contract' }
        ]
      },
      {
        id: 'SANGINES14_H4',
        name: 'H4',
        price: 280,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: '56€ fijos',
        targetProfile: 'students',
        tenant: {
          name: 'MATHÉO PLESSIS',
          email: '',
          phone: '+33 6 84 97 53 77',
          idNumber: '180572351149',
          startDate: '27/08/2025',
          endDate: '31/07/2026',
          deposit: 280
        },
        timeline: [
          { id: 'SGINES_H4_RESERVE', date: '20/06/2025', text: 'Reserva de plaza recibida (280,00€).', type: 'info' },
          { id: 'SGINES_H4_START', date: '25/08/2025', text: 'Firma contrato: Mathéo Plessis. Renta 280€ + 56€ gastos.', type: 'contract' },
          { id: 'SGINES_H4_ENTRY', date: '27/08/2025', text: 'Inicio estancia y pago inicial (54,16€: 45,16€ renta prorrateada + 9,00€ gastos fijos). Fianza 280€ (vía reserva).', type: 'info' }
        ]
      },
      {
        id: 'SANGINES14_H5',
        name: 'H5',
        price: 230,
        status: 'occupied',
        availableFrom: '27/04/2026',
        expenses: '56€ fijos',
        targetProfile: 'workers',
        tenant: {
          name: 'BOULAMAICE SALAHIEDDINE',
          email: '',
          phone: '+34 651 73 48 01',
          idNumber: 'Z1115896X',
          startDate: '27/05/2025',
          endDate: '27/04/2026',
          deposit: 230
        },
        timeline: [
          { id: 'SGINES_H5_START', date: '27/05/2025', text: 'Firma contrato: BOULAMAICE SALAHIEDDINE. Renta 230€ + 56€ gastos.', type: 'contract' },
          { id: 'SGINES_H5_ENTRY', date: '27/05/2025', text: 'Inicio estancia y entrega de llaves. Fianza 230€ y junio 2025 abonados.', type: 'info' }
        ]
      },
      {
        id: 'SANGINES14_H6',
        name: 'H6',
        price: 280,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: '56€ fijos',
        targetProfile: 'students',
        tenant: {
          name: 'VALENTINE CHIDERA AJAGWU',
          email: '',
          phone: '+34 614 15 64 63',
          idNumber: 'Z0195398H',
          startDate: '01/09/2025',
          endDate: '31/07/2026',
          deposit: 280
        },
        timeline: [
          { id: 'SGINES_H6_START', date: '02/07/2025', text: 'Firma contrato (renovación): Valentine Chidera Ajagwu. Renta 280€ + 56€ gastos.', type: 'contract' },
          { id: 'SGINES_H6_RESERVE', date: '31/07/2025', text: 'Pago de reserva (280,00€) imputado a la renta de Septiembre 2025.', type: 'info' },
          { id: 'SGINES_H6_ENTRY', date: '01/09/2025', text: 'Inicio estancia según renovación (ya en posesión). Fianza 280€ mantenida del contrato anterior.', type: 'info' }
        ]
      },
      {
        id: 'SANGINES14_H7',
        name: 'H7',
        price: 260,
        status: 'occupied',
        availableFrom: '31/07/2026',
        expenses: '56€ fijos',
        targetProfile: 'students',
        tenant: {
          name: 'MARIA TERESA ARMENTA',
          email: '',
          phone: '+34 602 10 93 91',
          idNumber: '29388339T',
          startDate: '01/09/2025',
          endDate: '31/07/2026',
          deposit: 260
        },
        timeline: [
          { id: 'SGINES_H7_START', date: '21/07/2025', text: 'Firma contrato (Renovación): Maria Teresa Armenta. Renta 260€ + 56€ gastos.', type: 'contract' },
          { id: 'SGINES_H7_RESERVE', date: '31/07/2025', text: 'Reserva (260€) para septiembre abonada. Fianza 260€ mantenida del contrato anterior.', type: 'info' },
          { id: 'SGINES_H7_ENTRY', date: '01/09/2025', text: 'Inicio nueva temporada (ya en posesión).', type: 'info' }
        ]
      }





    ]
  }
];
