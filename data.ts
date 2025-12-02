
import { Opportunity } from './types';

export const opportunities: Opportunity[] = [
  {
    id: 'RP1742025141383',
    title: 'Casa Exclusiva con Parcela en Calle Mayor',
    address: 'Calle Mayor',
    city: 'El Palmar (Murcia)',
    description: 'REDPISO VENDE EN EXCLUSIVA. Espectacular vivienda de dos plantas con 180 m² construidos sobre parcela de 467 metros.\n\nEsta amplia y luminosa propiedad ofrece una distribución ideal para el confort y la comodidad:\n• Elegante salón con acceso a balcón, perfecto para disfrutar de la luz natural.\n• Tres amplios dormitorios con armarios empotrados, uno de ellos con baño en suite.\n• Un baño completo adicional y un aseo de cortesía.\n• Buhardilla de 60 m², ideal como zona de ocio, despacho o espacio extra.\n• Cocina con office, con chimenea y acceso a una acogedora terraza.\n• Espaciosa plaza de garaje con capacidad para varios vehículos.\n• Terreno privado que brinda múltiples posibilidades.\n\nUna vivienda que combina amplitud, funcionalidad y una excelente ubicación.',
    features: [
      'Parcela 467 m²',
      '180 m² construidos',
      'Buhardilla 60 m²',
      '3 Baños',
      'Garaje Privado',
      'Chimenea',
      'Cocina Office',
      'Terraza y Patio'
    ],
    areaBenefits: [
      'Ubicación Céntrica (Calle Mayor)',
      'Zona Pedanías Oeste',
      'Servicios a pie',
      'Acceso rápido autovía'
    ],
    images: [
      'https://www.redpiso.es/upload/properties/img_9650619.jpg', // Pasillo/Exterior
      'https://www.redpiso.es/upload/properties/img_5990594.jpg', // Salón
      'https://www.redpiso.es/upload/properties/img_7871293.jpg', // Cocina
      'https://www.redpiso.es/upload/properties/img_0036583.jpg', // Buhardilla
      'https://www.redpiso.es/upload/properties/img_0982339.jpg', // Patio
      'https://www.redpiso.es/upload/properties/img_8311684.jpg', // Dormitorio
      'https://www.redpiso.es/upload/properties/img_0454085.jpg', // Baño
      'https://www.redpiso.es/upload/properties/img_2120756.jpg', // Garaje
      'https://www.redpiso.es/upload/properties/img_7553999.jpg'  // Fachada
    ],
    driveFolder: '#',
    scenario: 'sale_living', // Configurado como venta para vivienda habitual
    visibility: 'exact',
    specs: {
      rooms: 3,
      bathrooms: 3,
      sqm: 180,
      floor: 'Casa / Chalet',
      hasElevator: false
    },
    financials: {
      purchasePrice: 288900,
      itpPercent: 8,
      reformCost: 5000, // Estado "Perfecto", reforma mínima o pintura
      furnitureCost: 0,
      notaryAndTaxes: 26000, // Aprox ITP + Notaría
      totalInvestment: 320000, 
      monthlyRentProjected: 0, // No enfocado a alquiler habitaciones
      monthlyRentTraditional: 1200,
      yearlyExpenses: 1200, 
      marketValue: 310000,
      appreciationRate: 3
    },
    status: 'available',
    tags: ['Exclusiva', 'Parcela', 'El Palmar', 'Chalet']
  }
];
