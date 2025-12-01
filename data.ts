import { Opportunity } from './types';

export const opportunities: Opportunity[] = [
  {
    id: 'velazquez-12',
    title: 'Oportunidad Premium en Alcantarilla',
    address: 'Calle Pintor Velázquez, 12',
    city: 'Alcantarilla (Murcia)',
    description: 'Activo de alto rendimiento con 7 habitaciones funcionando a pleno rendimiento. Ubicación estratégica en Alcantarilla, zona con alta demanda de alquiler por habitaciones debido a la cercanía con polígonos industriales y conexiones.',
    features: [
      '7 Habitaciones alquiladas',
      'Reforma integral reciente',
      'Alta rentabilidad demostrable',
      'Gestión integral activa'
    ],
    areaBenefits: [
      'Junto a calle Mayor',
      'Conexión rápida con UCAM',
      'Todos los servicios a pie',
      'Zona tranquila y segura'
    ],
    images: [
      'https://i.ibb.co/bgfbkz88/1729857046896.jpg',
      'https://i.ibb.co/TXw56F9/1729857046869.jpg',
      'https://i.ibb.co/DgpkkCP4/1729857046983.jpg',
      'https://i.ibb.co/fd16hxDg/1729857047031.jpg'
    ],
    driveFolder: 'https://drive.google.com/drive/folders/EXAMPLE_VELAZQUEZ',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 7,
      bathrooms: 2,
      sqm: 140,
      floor: '3º',
      hasElevator: false
    },
    financials: {
      purchasePrice: 135000,
      reformCost: 35000,
      furnitureCost: 8000,
      notaryAndTaxes: 12000,
      totalInvestment: 190000, // Approx base
      monthlyRentProjected: 1960, // Sum of CSV rents approx
      monthlyRentTraditional: 800,
      yearlyExpenses: 1200,
      marketValue: 210000,
      appreciationRate: 3.5
    },
    status: 'available',
    tags: ['Alta Rentabilidad', '7 Habs', 'Alcantarilla']
  },
  {
    id: 'rosario-71',
    title: 'Coliving Universitario La Ñora',
    address: 'Calle Rosario, 71',
    city: 'La Ñora (Murcia)',
    description: 'Máquina de generar cashflow junto a la UCAM. Vivienda de grandes dimensiones adaptada para 9 estudiantes. Ubicación prime para estudiantes de la Universidad Católica.',
    features: [
      '9 Habitaciones',
      'A 5 min andando de UCAM',
      'Demanda garantizada 10 meses',
      'Contratos de temporada'
    ],
    areaBenefits: [
      'Zona universitaria UCAM',
      'Tranvía cercano',
      'Ambiente estudiantil',
      'Supermercados cercanos'
    ],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    ],
    driveFolder: 'https://drive.google.com/drive/folders/EXAMPLE_ROSARIO',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 9,
      bathrooms: 3,
      sqm: 180,
      floor: 'Bajo + 1º',
      hasElevator: true
    },
    financials: {
      purchasePrice: 220000,
      reformCost: 45000,
      furnitureCost: 12000,
      notaryAndTaxes: 20000,
      totalInvestment: 297000,
      monthlyRentProjected: 2980, // Sum based on CSV
      monthlyRentTraditional: 1100,
      yearlyExpenses: 1500,
      marketValue: 330000,
      appreciationRate: 4
    },
    status: 'available',
    tags: ['UCAM', '9 Habs', 'Premium']
  },
  {
    id: 'sangines-14',
    title: 'Oportunidad Inversión Murcia Sur',
    address: 'Plaza San Ginés, 14',
    city: 'Murcia',
    description: 'Piso muy luminoso en zona estratégica con fácil acceso a autovía y polígonos industriales. Ideal para perfil trabajador. Rentabilidad estable.',
    features: [
      '6 Habitaciones',
      'Zona tranquila',
      'Fácil aparcamiento',
      'Perfil trabajador'
    ],
    areaBenefits: [
      'Acceso autovía',
      'Polígono industrial oeste',
      'Servicios básicos',
      'Transporte público'
    ],
    images: [
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80'
    ],
    driveFolder: 'https://drive.google.com/drive/folders/EXAMPLE_SANGINES',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 6,
      bathrooms: 2,
      sqm: 110,
      floor: '1º',
      hasElevator: false
    },
    financials: {
      purchasePrice: 95000,
      reformCost: 25000,
      furnitureCost: 6000,
      notaryAndTaxes: 9000,
      totalInvestment: 135000,
      monthlyRentProjected: 1594,
      monthlyRentTraditional: 650,
      yearlyExpenses: 900,
      marketValue: 150000,
      appreciationRate: 3
    },
    status: 'reserved',
    tags: ['Económico', 'Rentabilidad', 'Oportunidad']
  },
  {
    id: 'sanjose-16',
    title: 'Piso Céntrico Alta Demanda',
    address: 'Calle San Jose 16',
    city: 'Murcia Centro',
    description: 'Ubicación inmejorable en el centro de Murcia. Habitaciones grandes y techos altos. Reforma de diseño para atraer al mejor perfil de inquilino.',
    features: [
      '5 Habitaciones grandes',
      'Centro ciudad',
      'Reforma diseño',
      'Alta demanda'
    ],
    areaBenefits: [
      'Centro histórico',
      'Zona comercial',
      'Vida nocturna',
      'Universidad La Merced'
    ],
    images: [
      'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=800&q=80'
    ],
    driveFolder: 'https://drive.google.com/drive/folders/EXAMPLE_SANJOSE',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 5,
      bathrooms: 2,
      sqm: 125,
      floor: '1º',
      hasElevator: true
    },
    financials: {
      purchasePrice: 160000,
      reformCost: 30000,
      furnitureCost: 7000,
      notaryAndTaxes: 15000,
      totalInvestment: 212000,
      monthlyRentProjected: 1630,
      monthlyRentTraditional: 900,
      yearlyExpenses: 1300,
      marketValue: 240000,
      appreciationRate: 5
    },
    status: 'sold',
    tags: ['Centro', 'Diseño', 'Lujo']
  }
];