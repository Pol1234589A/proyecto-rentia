
export interface BrokerRequest {
  id: string;
  reference: string;
  date: string;
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
    date: '28/11/25',
    type: 'Vivienda Unifamiliar / Piso',
    specs: '3 Habitaciones, 2 Baños',
    location: 'Molina de Segura y cercanías',
    condition: 'Buen estado / Para entrar',
    budget: 330000,
    notes: 'Cliente inversor patrimonial. Prioriza zonas tranquilas.'
  }
];
