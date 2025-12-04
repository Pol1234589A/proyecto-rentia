
export interface Room {
  id: string;
  name: string; // "H1", "H2", etc.
  price: number;
  status: 'available' | 'occupied' | 'reserved';
  availableFrom?: string; // Formato DD/MM/YYYY o 'Inmediata'
  targetProfile?: 'students' | 'workers' | 'both';
  expenses: string; // "Gastos fijos aparte" o "Se reparten los gastos"
  hasAirConditioning?: boolean;
  hasFan?: boolean; // Nuevo campo: Ventilador
  specialStatus?: 'new' | 'renovation'; // 'new' = Recién lanzado, 'renovation' = En reformas
  images?: string[]; // URLs de fotos específicas de la habitación
  video?: string;    // URL del video (YouTube, etc)
  notes?: string;
  driveUrl?: string; // Enlace carpeta drive específico si existe
  
  // CAMPOS DE OPTIMIZACIÓN (OPCIONALES)
  sqm?: number; // Metros cuadrados
  bedType?: 'single' | 'double' | 'king' | 'sofa'; // Tipo de cama
  features?: string[]; // ['balcony', 'smart_tv', 'lock', 'desk', 'closet', 'exterior']
  description?: string; // Descripción detallada específica de la habitación

  // CAMPOS DE COMISIÓN (NUEVO)
  commissionType?: 'percentage' | 'fixed'; // Porcentaje sobre renta o Cantidad fija
  commissionValue?: number; // El valor (ej: 10 para 10%, o 50 para 50€)
}

export interface Property {
  id: string;
  address: string;
  city: string;
  floor?: string; // Nuevo campo: Planta
  image: string; // Portada del piso
  bathrooms?: number; // Nuevo campo: Baños de la vivienda
  googleMapsLink: string;
  driveLink?: string; // Nuevo campo para carpeta Drive
  rooms: Room[];
  suppliesConfig?: {
      type: 'fixed' | 'shared';
      fixedAmount?: number;
  };
}

// Función auxiliar para generar enlace de maps
const getMapsLink = (address: string) => 
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const properties: Property[] = [
  {
    id: 'VELAZQ12',
    address: 'Calle Pintor Velázquez, 12',
    city: 'Alcantarilla (Murcia)',
    floor: '3º',
    image: 'https://i.ibb.co/bgfbkz88/1729857046896.jpg',
    bathrooms: 2,
    driveLink: 'https://drive.google.com/drive/folders/185JuNMSgQ1Kcli98L3w-i1h-rA20PRs0',
    googleMapsLink: getMapsLink('Calle Pintor Velázquez, 12, Alcantarilla, Murcia'),
    rooms: [
      { id: 'VELAZQ12_H1', name: 'H1', price: 290, status: 'occupied', availableFrom: '01/08/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: false, hasFan: true, video: 'https://youtube.com/shorts/mQJRnWNjhWw', images: ['https://i.ibb.co/bgfbkz88/1729857046896.jpg'], bedType: 'double', features: ['lock', 'desk'], sqm: 12, commissionType: 'percentage', commissionValue: 10 },
      { id: 'VELAZQ12_H2', name: 'H2', price: 250, status: 'occupied', availableFrom: '10/02/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: false, hasFan: true, video: 'https://youtube.com/shorts/Sn3BdS5we2I?feature=share', images: ['https://i.ibb.co/DgpkkCP4/1729857046983.jpg'], commissionType: 'fixed', commissionValue: 50 },
      { id: 'VELAZQ12_H3', name: 'H3', price: 270, status: 'occupied', availableFrom: '01/11/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: true, video: 'https://youtube.com/shorts/9a0eTZcg4bY', images: ['https://i.ibb.co/fd16hxDg/1729857047031.jpg'], commissionType: 'percentage', commissionValue: 10 },
      { id: 'VELAZQ12_H4', name: 'H4', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: true, video: 'https://youtube.com/shorts/V8ku5NhXlUs', images: ['https://i.ibb.co/Vp22dL8z/1729857047344.jpg'], commissionType: 'percentage', commissionValue: 10 },
      { id: 'VELAZQ12_H5', name: 'H5', price: 270, status: 'occupied', availableFrom: '07/09/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: false, hasFan: true, video: 'https://youtube.com/shorts/WUot0rN0fTA', images: ['https://i.ibb.co/gMP6FMMW/1729857047393.jpg'], commissionType: 'percentage', commissionValue: 10 },
      { id: 'VELAZQ12_H6', name: 'H6', price: 280, status: 'occupied', availableFrom: '15/07/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: true, video: 'https://youtube.com/shorts/GFWIeP0r8Z8', images: ['https://i.ibb.co/qLQ8Jgvc/1729857047292.jpg'], commissionType: 'percentage', commissionValue: 10 },
      { id: 'VELAZQ12_H7', name: 'H7', price: 320, status: 'occupied', availableFrom: '01/08/2025', expenses: 'Gastos fijos aparte', targetProfile: 'both', hasAirConditioning: true, video: 'https://youtube.com/shorts/lj-qYj0pY4M', images: ['https://i.ibb.co/3984GxTs/1729857047150.jpg'], commissionType: 'percentage', commissionValue: 10 },
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
