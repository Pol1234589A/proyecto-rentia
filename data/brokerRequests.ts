
export type RequestTag = 'collaboration' | 'exclusive' | 'own';

export interface BrokerRequest {
  id: string;
  reference: string;
  type: string;
  specs: string;
  location: string;
  condition: string;
  budget: number; // 0 significa "Sin tope" o "Flexible"
  notes?: string;
  tag: RequestTag;
  // Campos extendidos para CRM y Web Forms
  name?: string;     // Privado (Solo admin)
  contact?: string;  // Privado (Solo admin)
  email?: string;    // Privado (Solo admin)
  origin?: 'crm' | 'web';
  gdprAccepted?: boolean;
  gdprDate?: any;
  createdAt?: any; // Para ordenación
}

export const brokerRequests: BrokerRequest[] = [
  {
    id: '1',
    reference: 'INM-7465-A',
    type: 'Vivienda (Pref. Punta Calera)',
    specs: 'Min 2 Hab, 2 Baños, Garaje doble',
    location: 'Los Narejos (Punta Calera)',
    condition: 'Buena orientación / Sol mañana',
    budget: 200000,
    notes: 'Pago al contado. Imprescindible zona exterior, jardín o patio soleado.',
    tag: 'collaboration'
  },
  {
    id: '2',
    reference: 'INM-2994',
    type: 'Casa / Dúplex / Casa de Campo',
    specs: 'Mínimo 3 Habitaciones',
    location: 'El Palmar / Sangonera / Aljucer',
    condition: 'Sin vecinos pegados',
    budget: 165000,
    notes: 'Necesario plaza de garaje o sitio para el coche.',
    tag: 'collaboration'
  },
  {
    id: '3',
    reference: 'RENTIA-8589',
    type: 'Piso Planta Baja (Accesible)',
    specs: '2+ Hab, 2 Baños, Garaje, Trastero',
    location: 'Murcia / Alrededores',
    condition: 'Movilidad Reducida',
    budget: 0,
    notes: 'Urgente. Movilidad reducida. No hay tope de precio si encaja.',
    tag: 'own'
  },
  {
    id: '4',
    reference: 'INM-7465-B',
    type: 'Piso Céntrico o Ciudad Jardín',
    specs: 'Vivienda estándar',
    location: 'Cartagena',
    condition: 'Buen estado / A reformar',
    budget: 140000,
    notes: 'Buscan en Centro, Ciudad Jardín o zonas bien valoradas.',
    tag: 'collaboration'
  },
  {
    id: '5',
    reference: 'INM-0426',
    type: 'Vivienda con Jardín',
    specs: 'Mínimo 3 Habitaciones',
    location: 'Zona Costera (Mar Menor / Manga)',
    condition: 'Cerca de la playa',
    budget: 280000,
    notes: 'Nietos, Urrutias, Alcázares, Narejos, Ribera, San Pedro, Lo Pagán...',
    tag: 'collaboration'
  },
  {
    id: '6',
    reference: 'INM-7465-C',
    type: 'Casa cerca de la playa',
    specs: '2 o más habitaciones',
    location: 'Los Narejos / Los Alcázares',
    condition: 'Aceptan reforma',
    budget: 200000,
    notes: 'Cliente busca casa, no importa el estado si entra en precio.',
    tag: 'collaboration'
  },
  {
    id: '7',
    reference: 'INM-ARAC-0599',
    type: 'Casa / Piso / Dúplex',
    specs: 'Estándar',
    location: 'El Palmar',
    condition: 'Segunda Mano',
    budget: 0,
    notes: 'Búsqueda activa para clienta en esta zona específica.',
    tag: 'collaboration'
  },
  {
    id: '8',
    reference: 'INM-0578',
    type: 'Dúplex o Ático',
    specs: 'Min 3 Hab (Pref. 4)',
    location: 'La Alberca / Santo Ángel',
    condition: 'Buen estado',
    budget: 320000,
    notes: 'Producto específico: Dúplex o Ático.',
    tag: 'collaboration'
  }
];