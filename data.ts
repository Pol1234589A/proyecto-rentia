
import { Opportunity } from './types';

// Helper for dates
const getRecentDate = (hoursAgo: number) => {
    const d = new Date();
    d.setHours(d.getHours() - hoursAgo);
    return d.toISOString();
};

export const opportunities: Opportunity[] = [
  {
    id: 'JAVALI-IGLESIA-118',
    title: 'Casa con Patio y Terraza en Javalí Viejo: Proyecto Coliving',
    address: 'C. de la Iglesia',
    city: 'Javalí Viejo (Murcia)',
    description: `OPORTUNIDAD DE INVERSIÓN ENFOCADA A CASHFLOW.

Presentamos esta casa de dos plantas en pleno centro de Javalí Viejo, una ubicación estratégica rodeada de todos los servicios (supermercados, farmacia, colegio) y con excelente conexión.

ESTADO DEL INMUEBLE:
La vivienda se encuentra a medio reformar, ofreciendo un lienzo ideal para maximizar el valor con una inversión controlada:
1. **Planta Baja:** Espacio versátil para configurar salón-cocina, 1 o 2 baños completos y hasta 2 habitaciones. La joya de esta planta es su **amplio patio privado**, con espacio suficiente para piscina y zona de barbacoa, un factor diferencial clave para el alquiler por habitaciones.
2. **Planta Alta:** Totalmente diáfana, lo que facilita la distribución a medida. Cuenta con suelo recién cambiado, ventanas nuevas, baño instalado y techo reforzado con vigas de alta calidad y aislamiento proyectado. Acceso a dos terrazas privadas.

ESTUDIO DE VIABILIDAD (ESTIMADO*):
El activo permite una configuración óptima de 5 habitaciones (con posibilidad de una 6ª en el salón).
- **Precio Objetivo:** 250 €/habitación + gastos.
- **Ingreso Bruto Estimado:** ~1.250 €/mes.
- **Estrategia:** Proyecto enfocado a maximizar el Cashflow mensual, priorizando un flujo de caja constante y seguro frente a la especulación de valor.

*Nota: Los costes de reforma se han ajustado para una terminación de alta calidad y puesta a punto integral.*`,
    features: [
      '2 Plantas',
      'Patio Privado (Apto Piscina)',
      '2 Terrazas',
      'Techo Reforzado y Aislado',
      'Ventanas Nuevas (P. Alta)',
      'Potencial 5-6 Habitaciones',
      'Junto a Servicios'
    ],
    areaBenefits: [
      'Centro del Pueblo',
      'Servicios a pie de calle',
      'Transporte Público',
      'Zona Tranquila'
    ],
    images: [
      'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1200&q=80', // Fachada casa pueblo (Placeholder)
      'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=1200&q=80', // Patio potencial (Placeholder)
      'https://images.unsplash.com/photo-1502005229762-cf1e25374e74?auto=format&fit=crop&w=1200&q=80', // Interior diáfano (Placeholder)
    ],
    driveFolder: '#',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 5, // Configuración base
      bathrooms: 2, // 1 existente + 1 proyectado
      sqm: 140, // Estimado según descripción
      floor: 'Casa Completa',
      hasElevator: false
    },
    financials: {
      purchasePrice: 118000,
      itpPercent: 8,
      reformCost: 80000, // Actualizado a 80k (Reforma Integral/Completa)
      furnitureCost: 5000, 
      notaryAndTaxes: 1500 + (118000 * 0.08), // Notaría + ITP (~11k)
      totalInvestment: 213940, // 118k + 11k + 80k + 5k
      monthlyRentProjected: 1250, // 5 habs * 250€
      monthlyRentTraditional: 750,
      yearlyExpenses: 350, // IBI estimado y seguro
      marketValue: 175000, // Valor tras reforma integral
      appreciationRate: 3
    },
    status: 'available',
    tags: ['Reforma Integral', 'Patio Privado', 'Cashflow', 'Javalí Viejo'],
    roomConfiguration: [
      { name: 'Habitación 1 (P. Baja)', price: 250 },
      { name: 'Habitación 2 (P. Baja)', price: 250 },
      { name: 'Habitación 3 (P. Alta)', price: 250 },
      { name: 'Habitación 4 (P. Alta)', price: 250 },
      { name: 'Habitación 5 (P. Alta)', price: 250 }
    ],
    disableLivingRoomExpansion: false, // Permitimos simular la 6ª habitación en la web
    createdAt: getRecentDate(1) // 1 hour ago (New)
  },
  {
    id: 'TORREVIEJA-COLIVING-5HAB',
    title: 'Máquina de Cashflow en Torrevieja: 5 Hab + 3 Baños',
    address: 'C. San Pascual 37',
    city: 'Torrevieja (Alicante)',
    description: `OPORTUNIDAD DE ALTO RENDIMIENTO.

Activo funcionando actualmente como Coliving/Hostel con una ocupación y rentabilidad demostrable. Se trata de una propiedad optimizada para el alquiler por habitaciones con una característica única: GASTOS FIJOS MÍNIMOS.

DETALLES DE LA EXPLOTACIÓN:
1. Distribución Premium: 5 Habitaciones dobles, todas ellas equipadas con nevera propia, mobiliario completo y, lo más importante, BALCÓN PRIVADO en cada habitación.
2. Zonas Comunes: Cuenta con 3 baños completos compartidos, lo que ofrece un ratio excelente (menos de 2 habs por baño).
3. Eficiencia de Costes: El edificio no tiene Comunidad de Propietarios constituida, por lo que el gasto de comunidad es 0€. El IBI es extremadamente bajo (40€/año). Esto dispara el Cashflow Neto.

NÚMEROS ACTUALES (SEGÚN PROPIEDAD):
- Ingresos Mensuales: ~2.000 €
- Precio habitación: 390€ - 410€ (+ Gastos aparte).
- Suministros: Se cobran 30€/persona o 60€/pareja, cubriendo el coste real.

Es una oportunidad llave en mano para inversores que busquen flujo de caja inmediato sin necesidad de reforma inicial.`,
    features: [
      '5 Habitaciones Dobles',
      '3 Baños Completos',
      'Balcón Privado en todas las habs',
      'Gastos Comunidad 0€',
      'IBI muy bajo (40€/año)',
      'Ingresos actuales 2.000€/mes',
      'Amueblado y Equipado'
    ],
    areaBenefits: [
      'Zona Céntrica Torrevieja',
      'Alta demanda alquiler',
      'Servicios a pie de calle',
      'Cerca de Estación de Autobuses'
    ],
    images: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80', // Dormitorio con balcón (Placeholder)
      'https://images.unsplash.com/photo-1599619351208-eb72c1e695d7?auto=format&fit=crop&w=1200&q=80', // Balcón
      'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80'  // Baño moderno
    ],
    driveFolder: '#',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 5,
      bathrooms: 3,
      sqm: 130, // Estimado
      floor: 'Entreplanta/1º',
      hasElevator: false
    },
    financials: {
      purchasePrice: 145000, // Estimado para rentabilidad atractiva
      itpPercent: 10, // C. Valenciana suele ser 10%
      reformCost: 2000, // Lavado de cara / Pintura
      furnitureCost: 0, // Ya equipado según texto
      notaryAndTaxes: 14500 + 1500, // ITP + Notaria
      totalInvestment: 163000, 
      monthlyRentProjected: 2000, // Actualizado: +20€/hab x 5 habs = +100€/mes -> 1900 + 100 = 2000
      monthlyRentTraditional: 800,
      yearlyExpenses: 400, // IBI 40€ + Seguro
      marketValue: 160000,
      appreciationRate: 3
    },
    status: 'available',
    tags: ['Cashflow Alto', 'Sin Comunidad', 'Torrevieja', '5 Habitaciones'],
    roomConfiguration: [
      { name: 'Habitación 1', price: 400 },
      { name: 'Habitación 2', price: 400 },
      { name: 'Habitación 3', price: 400 },
      { name: 'Habitación 4', price: 400 },
      { name: 'Habitación 5', price: 400 }
    ],
    disableLivingRoomExpansion: true, // Desactivar salón como habitación extra
    createdAt: getRecentDate(48)
  },
  {
    id: 'JAVALI-REFORMA-30',
    title: 'Casa Señorial 257m² con Patio: Proyecto Coliving UCAM',
    address: 'Calle Mayor 5',
    city: 'Javalí Viejo (Murcia)',
    description: `OPORTUNIDAD VALUE-ADD: LIENZO EN BLANCO ESTRATÉGICO.

Presentamos una oportunidad única para inversores con visión: una casa señorial de 257 m² ubicada a escasos minutos de la UCAM. Esta propiedad no es una simple casa para reformar; es un activo de alto rendimiento en potencia ("Vaca Lechera").

SU VERDADERO VALOR:
1. Versatilidad Legal: Cuenta con dos entradas independientes desde la calle, permitiendo la segregación física en dos viviendas o la optimización de flujos en un coliving.
2. Oasis Exterior: Un impresionante patio privado con terrazas y aljibe tradicional funcional. Un lujo difícil de encontrar que dispara el valor de la habitación.
3. Estructura Diáfana: Techos altos y vigas vistas, ideal para diseño industrial/moderno.

ESTUDIO DE VIABILIDAD (ESCENARIOS):

⭐ ESCENARIO A (RECOMENDADO): COLIVING ESTUDIANTES PREMIUM
Explotación intensiva para estudiantes UCAM.
- Distribución: 7 Habitaciones Dobles + Zonas Comunes de calidad.
- Ingresos Estimados: 2.170 €/mes (26.040 €/año) calculados a un precio conservador de 310€/hab.
- Rentabilidad Bruta Estimada: >10% sobre inversión total (~250k).

ESCENARIO B: SEGREGACIÓN (DIVISIÓN HORIZONTAL)
Creación de dos viviendas independientes (dúplex o planta baja).
- Perfil: Familias larga estancia o profesores.
- Ingresos Estimados: 1.500 €/mes.
- Ventaja: Gestión simplificada.

ESCENARIO C: FLIP (COMPRA-REFORMA-VENTA)
Transformación en vivienda unifamiliar de lujo con jardín.
- Valor de Reventa (ARV) estimado: 240.000 € - 260.000 €.

CONCLUSIÓN DEL EXPERTO:
Los 257 m² permiten diluir el coste de la reforma integral entre 7 unidades rentables. El patio es el factor "X" que permitirá alquilar muy rápido en un precio competitivo, garantizando una ocupación plena.`,
    features: [
      '257 m² Construidos',
      '2 Entradas Independientes',
      'Patio Privado con Aljibe',
      'Techos Altos',
      'Estructura Diáfana',
      'Potencial 7 Habitaciones',
      'A 5 min UCAM',
      'Rentabilidad >10%'
    ],
    areaBenefits: [
      'Alta Demanda Estudiantil',
      'Conexión directa Murcia',
      'Zona Tranquila',
      'Servicios a pie'
    ],
    images: [
      'https://images.unsplash.com/photo-1594498653385-d5175c532c38?auto=format&fit=crop&w=1200&q=80', // Patio / Exterior
      'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=1200&q=80', // Estructura diáfana
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'  // Detalle arquitectónico
    ],
    driveFolder: '#',
    scenario: 'rent_rooms', 
    visibility: 'exact',
    specs: {
      rooms: 0, // Estado actual (diáfano)
      bathrooms: 0, // A construir
      sqm: 257,
      floor: 'Casa Señorial',
      hasElevator: false
    },
    financials: {
      purchasePrice: 105000,
      itpPercent: 8,
      // Estimación Reforma Integral (Escenario A): ~500€/m2 x 257m2 = ~128.500€
      reformCost: 128000, 
      furnitureCost: 8000, // Equipamiento 7 habitaciones + comunes
      notaryAndTaxes: 1500 + (105000 * 0.08), // Notaría + ITP
      totalInvestment: 250900, // Suma aproximada total
      monthlyRentProjected: 2170, // 7 habs x 310€
      monthlyRentTraditional: 1500, // Escenario B
      yearlyExpenses: 1200, // IBI + Seguros estimados
      marketValue: 260000, // ARV Escenario C
      appreciationRate: 5
    },
    status: 'available',
    tags: ['Value-Add', 'Rentabilidad >10%', 'Coliving', 'Patio Privado'],
    createdAt: getRecentDate(96)
  },
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
    tags: ['Exclusiva', 'Parcela', 'El Palmar', 'Chalet'],
    createdAt: getRecentDate(120) // Old
  },
  {
    id: 'DÚPLEX-JAVALI-MAYOR',
    title: 'Dúplex Estratégico en Calle Mayor - Inversión Patrimonial',
    address: 'Calle Mayor',
    city: 'Javalí Viejo (Zona Centro)',
    description: 'VALOR REFUGIO EN CALLE MAYOR. Dúplex unifamiliar que elimina el mayor enemigo de la rentabilidad: los gastos fijos. Al no tener comunidad de vecinos (solo 35€/año), tu Cashflow Neto es muy superior al de un piso equivalente en un edificio.\n\nUbicación estratégica en el centro de Javalí Viejo, conectada con la UCAM y Murcia.\n\nVersatilidad Total:\n1. Alquiler Familiar (850€/mes): Alta demanda por sus 3 habitaciones, garaje y espacios exteriores (patio + terraza).\n2. Alquiler por Habitaciones (1.080€/mes): Perfecto para estudiantes UCAM que buscan tranquilidad y calidad.\n\nDispone de 104m² distribuidos en salón, cocina con lavadero y patio, 3 habitaciones dobles y una espectacular terraza solarium privada. Plaza de garaje incluida. Inversión segura con costes operativos mínimos.',
    features: [
      'Sin Gastos Comunidad',
      '3 Habitaciones Dobles',
      'Terraza Solarium',
      'Patio Privado',
      'Garaje Incluido',
      'Trastero',
      'Zona Lavandería'
    ],
    areaBenefits: [
      'Calle Mayor (Centro)',
      'Cerca UCAM',
      'Zona Tranquila',
      'Servicios a pie'
    ],
    images: [
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.10.jpeg?alt=media&token=03c78286-5521-45e8-8bf5-044023e07524',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(1).jpeg?alt=media&token=f1a64f5b-c84d-41d8-b075-2ce05bdd9ef4',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(10).jpeg?alt=media&token=6f49f650-70b8-43f2-b956-1964e3665a44',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(11).jpeg?alt=media&token=89bfe253-2f22-40ef-9c3f-4390b1ff3502',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(2).jpeg?alt=media&token=acdf12e4-5a21-4844-a0d5-7220726d6f35',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(3).jpeg?alt=media&token=7c9d71cb-5ccb-41b9-8f39-4453da9bbaad',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(4).jpeg?alt=media&token=e5631865-8ac4-4dcf-872c-2d19eba07ef9',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(5).jpeg?alt=media&token=c004f729-0a90-40b4-991b-07457c4550aa',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(6).jpeg?alt=media&token=9d0763ba-5393-4fd7-8366-13bfe1d921ed',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(7).jpeg?alt=media&token=18b9d4a1-a3b5-4886-a238-f48438f9a53c',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(8).jpeg?alt=media&token=b78d45f8-56aa-4495-ae08-0f69cb505d52',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11%20(9).jpeg?alt=media&token=f599ebd0-39d5-40db-a333-e242a7c74402',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.11.jpeg?alt=media&token=2c70f2d1-d081-40f4-8394-d0e5fa69f57a',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(1).jpeg?alt=media&token=b53aad06-156d-4859-83a4-f79e982dcbca',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(10).jpeg?alt=media&token=cef1f0d5-2460-4c57-bb46-7c333dcb475f',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(12).jpeg?alt=media&token=434e82cd-401b-4af9-b769-34670265fb9a',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(13).jpeg?alt=media&token=76363277-b646-4038-8cb8-80ccf23d4aa0',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(2).jpeg?alt=media&token=bd78bc24-cc4d-4fc4-a5f8-1ec6aebd540e',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(3).jpeg?alt=media&token=b54ca957-093f-4b50-a6d7-2866f8c4fc71',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(4).jpeg?alt=media&token=8a9ddf9a-2cf6-4fc4-b9a1-9849b66efea3',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(5).jpeg?alt=media&token=c192b939-2900-4ff5-a25e-197aa0d06095',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(6).jpeg?alt=media&token=437301e4-83cd-4d51-ad0b-a5a8a75a53ef',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(7).jpeg?alt=media&token=c76884f5-9d95-4f4c-a362-ee11ef02beec',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(8).jpeg?alt=media&token=44fa7c68-7da7-43e2-a653-113477688511',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12%20(9).jpeg?alt=media&token=58e11377-2044-43a8-b6ea-369cb2f978bc',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.12.jpeg?alt=media&token=dab1f531-6c04-4035-b4e9-d35841f715b4',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.13%20(1).jpeg?alt=media&token=f6ee2be3-3e99-471a-9317-4b526f574b0a',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20JAVALI%20VIEJO%20CALLE%20MAYOR%2052%2FWhatsApp%20Image%202025-12-11%20at%2014.34.13.jpeg?alt=media&token=941a1224-55ba-4619-bc35-1e562349617a'
    ],
    driveFolder: '#',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 3,
      bathrooms: 2,
      sqm: 104,
      floor: 'Dúplex',
      hasElevator: false // Unifamiliar usually no elevator unless specified
    },
    financials: {
      purchasePrice: 172000,
      itpPercent: 8,
      reformCost: 0,
      furnitureCost: 0,
      notaryAndTaxes: 15760, // 8% of 172000 is 13760 + 2000 = 15760
      totalInvestment: 187760,
      monthlyRentProjected: 1080,
      monthlyRentTraditional: 850,
      yearlyExpenses: 383,
      marketValue: 185000,
      appreciationRate: 3
    },
    status: 'available',
    tags: ['Eficiencia Neta', 'Sin Comunidad', 'Dúplex', 'Rentabilidad'],
    createdAt: getRecentDate(120) // Old
  },
  {
    id: 'NORA-JARDIN-UCAM',
    title: 'Lienzo en Blanco con Jardín Privado en La Ñora - Proyecto Value-Add',
    address: 'Calle Nuestra Señora del Paso 6',
    city: 'La Ñora (Murcia)',
    description: `OPORTUNIDAD VALUE-ADD. ¿Buscas rentabilidad real? Olvídate de pisos cosméticos. Esto es inversión pura en el corazón universitario de Murcia (UCAM).\n\nPresentamos una propiedad singular: Planta baja diáfana de 118 m² sobre una parcela gráfica de 243 m². Estado actual en bruto (obra de 2008), funcionando como el lienzo perfecto para el inversor inteligente.\n\n¿Por qué es una oportunidad única?\n1. El Activo Oculto: Un impresionante patio/jardín privado de 125 m². Un "Unicornio" en el mercado de alquiler estudiantil. Imagina el valor de ofrecer zona chill-out privada, barbacoa o huerto urbano a estudiantes. Permite cobrar el rango más alto de alquiler.\n2. Ventaja del "Bruto": No pagas por lo que vas a tirar. Ahorras costes de demolición. Diseña la distribución EXACTA para maximizar el Cashflow (ej. 5 habitaciones premium iguales, 2/3 baños completos) sin las limitaciones de muros de carga antiguos.\n3. Potencial Futuro: La estructura permite edificar alturas adicionales, multiplicando el valor del suelo a largo plazo.\n\nEstrategia: Compra + Reforma Integral para crear el producto de alquiler más exclusivo de La Ñora.`,
    features: [
      'Parcela 243 m²',
      'Jardín Privado 125 m²',
      '118 m² Diáfanos',
      'Potencial 5 Hab',
      'Junto UCAM',
      'Obra 2008',
      'Acceso Independiente',
      'Ampliación Futura Posible'
    ],
    areaBenefits: [
      'Alta Demanda UCAM',
      'Zona Tranquila',
      'Servicios a pie',
      'Transporte Público'
    ],
    images: [
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(1).jpeg?alt=media&token=02b06db6-1474-4dac-89aa-005498145b92',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(2).jpeg?alt=media&token=b949bd2f-7f57-42ce-a8fd-51c22fb8f4bd',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(3).jpeg?alt=media&token=a4f65763-8c51-441a-8133-5e2caab0f195',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(4).jpeg?alt=media&token=e71bcb9d-328c-4ef4-bbd8-f80c14fa83ac',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(5).jpeg?alt=media&token=aa0f28ac-3252-4ca8-ac83-d54eba9d3f11',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(6).jpeg?alt=media&token=5a9f012b-86af-4b76-8f21-90540780c647',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(7).jpeg?alt=media&token=36987fff-b761-4c5c-9024-21c7b3442b74',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(8).jpeg?alt=media&token=911bdd26-c4a2-43a5-8377-a844479de9ec',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46%20(9).jpeg?alt=media&token=14ecc5e4-0e24-47e9-9665-6aa2da1b3cce',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.46.jpeg?alt=media&token=02a49467-14de-4f9f-9a88-fe96319c1cea',
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Image%202025-12-11%20at%2014.44.47.jpeg?alt=media&token=d3cd43f3-6c7a-4d83-8c87-77ff9c1e97e4'
    ],
    videos: [
      'https://firebasestorage.googleapis.com/v0/b/crm-rentiaroom.firebasestorage.app/o/VENTA%20DE%20VIVIENDAS%20(MANUAL)%2FMARY%20-%20CALLE%20MAYOR%205%20-%20JAVALI%20VIEJO%2FWhatsApp%20Video%202025-12-11%20at%2014.46.07.mp4?alt=media&token=f300f9ad-5fde-426d-a7e0-35e38be03870'
    ],
    driveFolder: '#',
    scenario: 'rent_rooms',
    visibility: 'exact',
    specs: {
      rooms: 5,
      bathrooms: 3,
      sqm: 118,
      floor: 'Bajo con Jardín',
      hasElevator: false 
    },
    financials: {
      purchasePrice: 120000,
      itpPercent: 8,
      reformCost: 75000,
      furnitureCost: 5000,
      notaryAndTaxes: 2500,
      totalInvestment: 212000,
      monthlyRentProjected: 1700,
      monthlyRentTraditional: 900,
      yearlyExpenses: 600,
      marketValue: 250000,
      appreciationRate: 5
    },
    status: 'available',
    tags: ['Value-Add', 'Jardín 125m²', 'UCAM', 'Reforma Integral'],
    createdAt: getRecentDate(120) // Old
  }
];
