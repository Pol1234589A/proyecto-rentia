
export interface BrokerRequest {
  id: string;
  reference: string;
  type: string;
  specs: string;
  location: string;
  condition: string;
  budget: number;
  notes?: string;
}

export const brokerRequests: BrokerRequest[] = [
  {
    id: '1',
    reference: 'ACG-6639',
    type: 'Vivienda Unifamiliar / Piso',
    specs: '3 Habitaciones, 2 Baños',
    location: 'Molina de Segura y cercanías',
    condition: 'Buen estado / Para entrar',
    budget: 330000,
    notes: 'Cliente inversor patrimonial. Prioriza zonas tranquilas.'
  },
  {
    id: '2',
    reference: 'ACG-9451',
    type: 'Vivienda Residencial',
    specs: 'Flexible',
    location: 'Mallorca (Palmanova - Cas Catala)',
    condition: 'Segunda Mano / Obra Nueva',
    budget: 2000000,
    notes: 'Cliente comprador directo. Zona costera exclusiva.'
  },
  {
    id: '3',
    reference: 'REF-7156',
    type: 'Hotel / Activo Turístico',
    specs: '80-100 Habitaciones',
    location: 'Zona Costera (< 1km mar)',
    condition: 'En funcionamiento / A reformar',
    budget: 5000000,
    notes: 'Inversión hotelera. Ubicación estratégica prioritaria.'
  },
  {
    id: '4',
    reference: 'ACG-666262',
    type: 'Piso / Duplex (No Bajo)',
    specs: '2 Habitaciones, 1 Baño',
    location: 'Torrevieja / Benijofar / Guardamar',
    condition: 'Segunda Mano',
    budget: 150000,
    notes: 'CASH BUYERS (Contado). Clientes en zona listos para visitar ya.'
  },
  {
    id: '5',
    reference: 'ACG-5534',
    type: 'Casa de Campo / Finca',
    specs: '2 Habitaciones, Gran Exterior',
    location: 'Jacarilla / Benejúzar',
    condition: 'Buen estado',
    budget: 130000,
    notes: 'Buscan espacio exterior amplio.'
  },
  {
    id: '6',
    reference: 'ACG-0171',
    type: 'Chalet Independiente',
    specs: '2-3 Hab, 2 Baños, Piscina',
    location: 'Los Ángeles / La Siesta (Torrevieja)',
    condition: 'Para entrar o A reformar',
    budget: 200000,
    notes: 'Indispensable independiente. Piscina o espacio para hacerla.'
  },
  {
    id: '7',
    reference: 'ACG-0006',
    type: 'Vivienda en Residencial',
    specs: 'Urb. El Palmeral',
    location: 'Alicante (El Palmeral)',
    condition: 'Buen estado',
    budget: 250000,
    notes: 'Búsqueda específica en este residencial.'
  }
];
