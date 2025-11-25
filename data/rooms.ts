
export interface Room {
  id: string;
  name: string; // "H1", "H2", etc.
  price: number;
  status: 'available' | 'occupied' | 'reserved';
  availableFrom?: string; // Formato DD/MM/YYYY o 'Inmediata'
  targetProfile?: 'students' | 'workers' | 'both';
  expenses: string; // Nuevo campo para tipo de gastos
  specialStatus?: 'new' | 'renovation'; // 'new' = Recién lanzado, 'renovation' = En reformas
}

export interface Property {
  id: string;
  address: string;
  city: string;
  image: string;
  googleMapsLink: string;
  rooms: Room[];
}

// Función auxiliar para generar enlace de maps
const getMapsLink = (address: string, city: string) => 
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`;

export const properties: Property[] = [
  {
    id: 'velazquez-12',
    address: 'Calle Pintor Velázquez, 12',
    city: 'Alcantarilla (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Pintor Velázquez 12', 'Alcantarilla Murcia'),
    rooms: [
      { id: 'v12-h1', name: 'H1', price: 290, status: 'occupied', availableFrom: '01/02/2026', expenses: 'Gastos fijos aparte' },
      { id: 'v12-h2', name: 'H2', price: 0, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'v12-h3', name: 'H3', price: 270, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'v12-h4', name: 'H4', price: 270, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
      { id: 'v12-h5', name: 'H5', price: 280, status: 'occupied', availableFrom: '30/11/2025', expenses: 'Gastos fijos aparte' },
      { id: 'v12-h6', name: 'H6', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte' },
      { id: 'v12-h7', name: 'H7', price: 320, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'rosario-71',
    address: 'Calle Rosario, 71',
    city: 'La Ñora (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Rosario 71', 'La Ñora Murcia'),
    rooms: [
      { id: 'r71-h1', name: 'H1', price: 330, status: 'occupied', availableFrom: '20/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h2', name: 'H2', price: 330, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h3', name: 'H3', price: 340, status: 'occupied', availableFrom: '01/10/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h4', name: 'H4', price: 340, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h5', name: 'H5', price: 340, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h6', name: 'H6', price: 320, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h7', name: 'H7', price: 320, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'r71-h8', name: 'H8', price: 330, status: 'available', availableFrom: 'Inmediata', expenses: 'Se reparten los gastos' },
      { id: 'r71-h9', name: 'H9', price: 280, status: 'occupied', availableFrom: '17/07/2026', expenses: 'Se reparten los gastos' },
    ]
  },
  {
    id: 'sangines-14',
    address: 'Plaza San Ginés, 14',
    city: 'Murcia (Centro)',
    image: '',
    googleMapsLink: getMapsLink('Plaza San Ginés 14', 'Murcia'),
    rooms: [
      { id: 'sg14-h1', name: 'H1', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sg14-h2', name: 'H2', price: 250, status: 'occupied', availableFrom: '31/12/2025', expenses: 'Gastos fijos aparte' },
      { id: 'sg14-h3', name: 'H3', price: 264, status: 'occupied', availableFrom: '31/12/2025', expenses: 'Gastos fijos aparte' },
      { id: 'sg14-h4', name: 'H4', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sg14-h5', name: 'H5', price: 240, status: 'occupied', availableFrom: '27/04/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sg14-h6', name: 'H6', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'salzillo-2',
    address: 'C. Salzillo, 2',
    city: 'El Palmar (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Salzillo 2', 'El Palmar Murcia'),
    rooms: [
      { id: 'sal2-h1', name: 'H1', price: 350, status: 'occupied', availableFrom: '01/06/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sal2-h2', name: 'H2', price: 369, status: 'occupied', availableFrom: '30/11/2025', expenses: 'Gastos fijos aparte' },
      { id: 'sal2-h3', name: 'H3', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
      { id: 'sal2-h4', name: 'H4', price: 250, status: 'occupied', availableFrom: '01/03/2026', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'sanjose-16',
    address: 'Calle San Jose, 16',
    city: 'Murcia',
    image: '',
    googleMapsLink: getMapsLink('Calle San Jose 16', 'Murcia'),
    rooms: [
      { id: 'sj16-h1', name: 'H1', price: 325, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sj16-h2', name: 'H2', price: 315, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sj16-h3', name: 'H3', price: 325, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sj16-h4', name: 'H4', price: 325, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sj16-h5', name: 'H5', price: 340, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'guillamon-27',
    address: 'C. Antonio Flores Guillamón, 27',
    city: 'Espinardo (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Antonio Flores Guillamón 27', 'Espinardo Murcia'),
    rooms: [
      { id: 'g27-h1', name: 'H1', price: 340, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Se reparten los gastos' },
      { id: 'g27-h2', name: 'H2', price: 270, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'g27-h3', name: 'H3', price: 270, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'g27-h4', name: 'H4', price: 250, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Se reparten los gastos' },
    ]
  },
  {
    id: 'sanmarcos-21',
    address: 'Calle San Marcos, 21',
    city: 'Barrio del Carmen (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle San Marcos 21', 'Barrio del Carmen Murcia'),
    rooms: [
      { id: 'sm21-h1', name: 'H1', price: 260, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sm21-h2', name: 'H2', price: 340, status: 'occupied', availableFrom: '31/03/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sm21-h3', name: 'H3', price: 280, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sm21-h4', name: 'H4', price: 250, status: 'occupied', availableFrom: '31/03/2026', expenses: 'Gastos fijos aparte' },
      { id: 'sm21-h5', name: 'H5', price: 340, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'santarita-2',
    address: 'Calle Santa Rita, 2',
    city: 'Patiño (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Santa Rita 2', 'Patiño Murcia'),
    rooms: [
      { id: 'sr2-h1', name: 'H1', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
      { id: 'sr2-h2', name: 'H2', price: 270, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
      { id: 'sr2-h3', name: 'H3', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
      { id: 'sr2-h4', name: 'H4', price: 230, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
    ]
  },
  {
    id: 'arcipreste-4',
    address: 'C. Arcipreste Mariano Aroca, 4',
    city: 'Barrio del Carmen (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Arcipreste Mariano Aroca 4', 'Barrio del Carmen Murcia'),
    rooms: [
      { id: 'ama4-h1', name: 'H1', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte' },
      { id: 'ama4-h2', name: 'H2', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte' },
      { id: 'ama4-h3', name: 'H3', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte' },
      { id: 'ama4-h4', name: 'H4', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte' },
    ]
  },
  {
    id: 'sancristobal-11',
    address: 'Calle San Cristobal, 11',
    city: 'Molina de Segura (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle San Cristobal 11', 'Molina de Segura Murcia'),
    rooms: [
      { id: 'sc11-h1', name: 'H1', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
      { id: 'sc11-h2', name: 'H2', price: 280, status: 'occupied', availableFrom: '01/03/2026', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
      { id: 'sc11-h3', name: 'H3', price: 240, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
      { id: 'sc11-h4', name: 'H4', price: 240, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new' },
    ]
  },
  {
    id: 'mayor-5',
    address: 'Calle Mayor, 5',
    city: 'Alcantarilla (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Mayor 5', 'Alcantarilla Murcia'),
    rooms: [
      { id: 'may5-h1', name: 'H1', price: 260, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
      { id: 'may5-h2', name: 'H2', price: 290, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
      { id: 'may5-h3', name: 'H3', price: 270, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
      { id: 'may5-h4', name: 'H4', price: 270, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
      { id: 'may5-h5', name: 'H5', price: 290, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
      { id: 'may5-h6', name: 'H6', price: 240, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
      { id: 'may5-h7', name: 'H7', price: 240, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation' },
    ]
  }
];
