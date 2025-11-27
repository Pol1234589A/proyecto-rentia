
export interface Room {
  id: string;
  name: string; // "H1", "H2", etc.
  price: number;
  status: 'available' | 'occupied' | 'reserved';
  availableFrom?: string; // Formato DD/MM/YYYY o 'Inmediata'
  targetProfile?: 'students' | 'workers' | 'both';
  expenses: string; // "Gastos fijos aparte" o "Se reparten los gastos"
  hasAirConditioning?: boolean; // Nuevo campo
  specialStatus?: 'new' | 'renovation'; // 'new' = Recién lanzado, 'renovation' = En reformas
  images?: string[]; // URLs de fotos específicas de la habitación
  video?: string;    // URL del video (YouTube, etc)
  notes?: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  image: string; // Portada del piso
  bathrooms?: number; // Nuevo campo: Baños de la vivienda
  googleMapsLink: string;
  driveLink?: string; // Nuevo campo para carpeta Drive
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
    image: 'https://i.ibb.co/bgfbkz88/1729857046896.jpg',
    bathrooms: 2,
    googleMapsLink: getMapsLink('Calle Pintor Velázquez 12', 'Alcantarilla Murcia'),
    driveLink: 'https://drive.google.com/drive/folders/185JuNMSgQ1Kcli98L3w-i1h-rA20PRs0',
    rooms: [
      { 
        id: 'vel12-h1', name: 'H1', price: 290, status: 'occupied', availableFrom: '01/02/2026', expenses: 'Gastos fijos aparte', hasAirConditioning: false, targetProfile: 'both',
        images: ['https://i.ibb.co/bgfbkz88/1729857046896.jpg', 'https://i.ibb.co/TXw56F9/1729857046869.jpg'],
        video: 'https://youtube.com/shorts/mQJRnWNjhWw'
      },
      { 
        id: 'vel12-h2', name: 'H2', price: 250, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', hasAirConditioning: false, targetProfile: 'both',
        images: ['https://i.ibb.co/DgpkkCP4/1729857046983.jpg'],
        video: 'https://youtube.com/shorts/Sn3BdS5we2I?feature=share'
      },
      { 
        id: 'vel12-h3', name: 'H3', price: 270, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', hasAirConditioning: true, targetProfile: 'both',
        images: ['https://i.ibb.co/fd16hxDg/1729857047031.jpg'],
        video: 'https://youtube.com/shorts/9a0eTZcg4bY'
      },
      { 
        id: 'vel12-h4', name: 'H4', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', hasAirConditioning: true, targetProfile: 'both',
        images: ['https://i.ibb.co/Vp22dL8z/1729857047344.jpg'],
        video: 'https://youtube.com/shorts/V8ku5NhXlUs'
      },
      { 
        id: 'vel12-h5', name: 'H5', price: 270, status: 'occupied', availableFrom: '01/02/2026', expenses: 'Gastos fijos aparte', hasAirConditioning: false, targetProfile: 'both',
        images: ['https://i.ibb.co/gMP6FMMW/1729857047393.jpg'],
        video: 'https://youtube.com/shorts/WUot0rN0fTA'
      },
      { 
        id: 'vel12-h6', name: 'H6', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte', hasAirConditioning: true, targetProfile: 'both',
        images: ['https://i.ibb.co/qLQ8Jgvc/1729857047292.jpg'],
        video: 'https://youtube.com/shorts/GFWIeP0r8Z8'
      },
      { 
        id: 'vel12-h7', name: 'H7', price: 320, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', hasAirConditioning: true, targetProfile: 'both',
        images: ['https://i.ibb.co/3984GxTs/1729857047150.jpg', 'https://i.ibb.co/6CjyN4b/1729857047199.jpg', 'https://i.ibb.co/Hph8ydRZ/1729857047248.jpg'],
        video: 'https://youtube.com/shorts/lj-qYj0pY4M'
      },
    ]
  },
  {
    id: 'rosario-71',
    address: 'Calle Rosario, 71',
    city: 'La Ñora (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Rosario 71', 'La Ñora Murcia'),
    rooms: [
      { id: 'ros71-h1', name: 'H1', price: 330, status: 'occupied', availableFrom: '20/06/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h2', name: 'H2', price: 330, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h3', name: 'H3', price: 340, status: 'occupied', availableFrom: '01/10/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h4', name: 'H4', price: 340, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h5', name: 'H5', price: 340, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h6', name: 'H6', price: 320, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h7', name: 'H7', price: 320, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h8', name: 'H8', price: 330, status: 'available', availableFrom: 'Inmediata', expenses: 'Se reparten los gastos', targetProfile: 'students' },
      { id: 'ros71-h9', name: 'H9', price: 280, status: 'occupied', availableFrom: '17/07/2026', expenses: 'Se reparten los gastos', targetProfile: 'students' },
    ]
  },
  {
    id: 'sangines-14',
    address: 'Plaza San Ginés, 14',
    city: 'Murcia',
    image: '',
    googleMapsLink: getMapsLink('Plaza San Ginés 14', 'Murcia'),
    rooms: [
      { id: 'sg9-h1', name: 'H1', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sg9-h2', name: 'H2', price: 250, status: 'occupied', availableFrom: '31/12/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sg9-h3', name: 'H3', price: 264, status: 'occupied', availableFrom: '31/12/2025', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sg9-h4', name: 'H4', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sg9-h5', name: 'H5', price: 240, status: 'occupied', availableFrom: '27/04/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sg9-h6', name: 'H6', price: 280, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
    ]
  },
  {
    id: 'salzillo-2',
    address: 'C. Salzillo 2',
    city: 'El Palmar (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Salzillo 2', 'El Palmar Murcia'),
    rooms: [
      { id: 'sal2-h1', name: 'H1', price: 350, status: 'occupied', availableFrom: '01/06/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sal2-h2', name: 'H2', price: 330, status: 'occupied', availableFrom: '01/06/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sal2-h3', name: 'H3', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sal2-h4', name: 'H4', price: 250, status: 'occupied', availableFrom: '01/03/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
    ]
  },
  {
    id: 'sanjose-16',
    address: 'Calle San Jose 16',
    city: 'Murcia',
    image: '',
    googleMapsLink: getMapsLink('Calle San Jose 16', 'Murcia'),
    rooms: [
      { id: 'sj16-h1', name: 'H1', price: 325, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sj16-h2', name: 'H2', price: 315, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sj16-h3', name: 'H3', price: 325, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sj16-h4', name: 'H4', price: 325, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
      { id: 'sj16-h5', name: 'H5', price: 340, status: 'occupied', availableFrom: '31/07/2026', expenses: 'Gastos fijos aparte', targetProfile: 'students' },
    ]
  },
  {
    id: 'guillamon-27',
    address: 'C. Antonio Flores Guillamón 27',
    city: 'Espinardo (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Antonio Flores Guillamón 27', 'Espinardo Murcia'),
    rooms: [
      { id: 'gui27-h1', name: 'H1', price: 340, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Se reparten los gastos' },
      { id: 'gui27-h2', name: 'H2', price: 270, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'gui27-h3', name: 'H3', price: 270, status: 'occupied', availableFrom: '30/06/2026', expenses: 'Se reparten los gastos' },
      { id: 'gui27-h4', name: 'H4', price: 250, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Se reparten los gastos' },
    ]
  },
  {
    id: 'sanmarcos-21',
    address: 'Calle San Marcos 21',
    city: 'Barrio del Carmen (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle San Marcos 21', 'Barrio del Carmen Murcia'),
    rooms: [
      { id: 'sm21-h1', name: 'H1', price: 260, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sm21-h2', name: 'H2', price: 340, status: 'occupied', availableFrom: '31/03/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sm21-h3', name: 'H3', price: 280, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sm21-h4', name: 'H4', price: 250, status: 'occupied', availableFrom: '31/03/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
      { id: 'sm21-h5', name: 'H5', price: 340, status: 'occupied', availableFrom: '31/01/2026', expenses: 'Gastos fijos aparte', targetProfile: 'both' },
    ]
  },
  {
    id: 'santarita-2',
    address: 'Calle Santa Rita, 2',
    city: 'Patiño (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Santa Rita 2', 'Patiño Murcia'),
    rooms: [
      { id: 'sr2-h1', name: 'H1', price: 280, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'both' },
      { id: 'sr2-h2', name: 'H2', price: 270, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'both' },
      { id: 'sr2-h3', name: 'H3', price: 250, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'both' },
      { id: 'sr2-h4', name: 'H4', price: 230, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'both' },
    ]
  },
  {
    id: 'arcipreste-4',
    address: 'C/ Arcipreste Mariano Aroca 4',
    city: 'Barrio del Carmen (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Arcipreste Mariano Aroca 4', 'Barrio del Carmen Murcia'),
    rooms: [
      { id: 'arc4-h1', name: 'H1', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
      { id: 'arc4-h2', name: 'H2', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
      { id: 'arc4-h3', name: 'H3', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
      { id: 'arc4-h4', name: 'H4', price: 330, status: 'occupied', availableFrom: 'Consultar', expenses: 'Gastos fijos aparte', targetProfile: 'workers' },
    ]
  },
  {
    id: 'sancristobal-11',
    address: 'Calle San Cristobal 11',
    city: 'Molina de Segura (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle San Cristobal 11', 'Molina de Segura Murcia'),
    rooms: [
      { id: 'sc11-h1', name: 'H1', price: 260, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'workers' },
      { id: 'sc11-h2', name: 'H2', price: 280, status: 'occupied', availableFrom: '01/03/2026', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'workers' },
      { id: 'sc11-h3', name: 'H3', price: 240, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'workers' },
      { id: 'sc11-h4', name: 'H4', price: 240, status: 'available', availableFrom: 'Inmediata', expenses: 'Gastos fijos aparte', specialStatus: 'new', notes: 'Recién en el mercado', targetProfile: 'workers' },
    ]
  },
  {
    id: 'mayor-5',
    address: 'Calle Mayor 5',
    city: 'Alcantarilla (Murcia)',
    image: '',
    googleMapsLink: getMapsLink('Calle Mayor 5', 'Alcantarilla Murcia'),
    rooms: [
      { id: 'may5-h1', name: 'H1', price: 260, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
      { id: 'may5-h2', name: 'H2', price: 290, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
      { id: 'may5-h3', name: 'H3', price: 270, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
      { id: 'may5-h4', name: 'H4', price: 270, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
      { id: 'may5-h5', name: 'H5', price: 290, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
      { id: 'may5-h6', name: 'H6', price: 240, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
      { id: 'may5-h7', name: 'H7', price: 240, status: 'occupied', availableFrom: '01/01/2026', expenses: 'Gastos fijos aparte', specialStatus: 'renovation', notes: 'Disponible a partir del 1 enero 2026', targetProfile: 'both' },
    ]
  }
];
