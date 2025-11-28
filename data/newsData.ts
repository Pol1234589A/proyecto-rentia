
export interface NewsItem {
  id: string;
  category: 'Mercado' | 'Regulación' | 'Consejo' | 'Tendencia' | 'Inversión';
  headline: string;
  body: string; // Nuevo campo para el contenido completo
  date: string; // Nuevo campo para fecha de publicación
  source: 'Analistas Rentia' | 'Mercado Murcia' | 'Noticias Sector' | 'BCE' | 'Idealista Data';
}

export const newsDatabase: NewsItem[] = [
  // NOVIEMBRE - DICIEMBRE 2024
  {
    id: 'n1',
    category: 'Mercado',
    headline: 'La demanda de habitaciones en Murcia crece un 15% en el último trimestre de 2024.',
    body: 'Según los últimos datos cruzados de los principales portales inmobiliarios y nuestra propia base de datos en RentiaRoom, la demanda de alojamiento compartido en Murcia capital ha experimentado un repunte del 15% interanual. Este fenómeno se atribuye principalmente a la escasez de oferta de alquiler tradicional de vivienda completa, que empuja a jóvenes profesionales y parejas a optar por el alquiler de habitaciones premium como solución habitacional a medio plazo.',
    date: '15 Nov 2024',
    source: 'Mercado Murcia'
  },
  {
    id: 'n2',
    category: 'Regulación',
    headline: 'Propietarios migran al alquiler de temporada para evitar topes de precios.',
    body: 'Ante la incertidumbre generada por la aplicación de la Ley de Vivienda en ciertas comunidades y el temor a futuras regulaciones en la Región de Murcia, un número significativo de pequeños propietarios está trasladando sus activos del mercado residencial convencional al mercado de temporada (alquiler por habitaciones o contratos inferiores a 11 meses). Esta modalidad, regida por el Código Civil y no por la LAU en términos de duración, ofrece mayor seguridad jurídica y flexibilidad para recuperar la vivienda.',
    date: '18 Nov 2024',
    source: 'Noticias Sector'
  },
  {
    id: 'n3',
    category: 'Inversión',
    headline: 'El barrio del Carmen: Zona de mayor rentabilidad bruta en Q4 2024.',
    body: 'Nuestro equipo de analistas ha identificado el Barrio del Carmen como el "punto caliente" de inversión para finalizar el año. Con precios de compra por metro cuadrado aún contenidos en comparación con la zona norte, y una demanda de alquiler fortísima gracias a la cercanía a la estación de tren y al centro, las rentabilidades brutas están superando el 9% en pisos reformados y adaptados para el alquiler por habitaciones.',
    date: '20 Nov 2024',
    source: 'Analistas Rentia'
  },
  {
    id: 'n4',
    category: 'Tendencia',
    headline: 'El perfil "Nómada Digital" busca habitaciones premium en Murcia centro.',
    body: 'Murcia empieza a posicionarse como destino atractivo para teletrabajadores nacionales y extranjeros. Este perfil no busca un piso compartido de estudiantes convencional. Exigen habitaciones con cama doble, escritorio ergonómico, aire acondicionado y, sobre todo, una conexión a internet de alta velocidad simétrica. Los propietarios que adaptan sus viviendas a este estándar están logrando rentas un 20% superiores a la media.',
    date: '22 Nov 2024',
    source: 'Idealista Data'
  },
  
  // INICIOS 2025 (Q1)
  {
    id: 'n5',
    category: 'Inversión',
    headline: 'Previsión 2025: Estabilización de tipos al 2,5% reactivará la compra para reforma.',
    body: 'El Banco Central Europeo da señales de una política monetaria más suave para el próximo ejercicio. Se espera que los tipos de interés se estabilicen en el entorno del 2,5% durante 2025. Esto abaratará las hipotecas y, previsiblemente, reactivará la demanda de compra de viviendas de segunda mano para reformar y destinar al alquiler, aumentando la competencia entre inversores.',
    date: '02 Ene 2025',
    source: 'BCE'
  },
  {
    id: 'n6',
    category: 'Mercado',
    headline: 'Récord histórico de solicitudes internacionales en la UCAM para enero 2025.',
    body: 'La Universidad Católica de Murcia (UCAM) reporta cifras récord de preinscripciones de estudiantes internacionales para el segundo cuatrimestre del curso. Esto generará un pico de demanda de alojamiento en enero y febrero, especialmente en las zonas de Guadalupe, La Ñora y el centro de Murcia (con buena conexión de tranvía). Se recomienda a los propietarios tener disponibilidad lista para estas fechas.',
    date: '10 Ene 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n7',
    category: 'Consejo',
    headline: 'El Aire Acondicionado aumenta el valor del alquiler un 12%.',
    body: 'En una ciudad con la climatología de Murcia, la climatización ha dejado de ser un lujo para convertirse en una necesidad básica. Nuestro análisis de cartera muestra que las habitaciones equipadas con Split de aire acondicionado individual se alquilan un 12% más caras y reducen el tiempo de vacancia en verano en un 40% respecto a las que solo tienen ventilador.',
    date: '15 Feb 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n8',
    category: 'Regulación',
    headline: 'Nuevas deducciones fiscales para rehabilitación de vivienda en Murcia.',
    body: 'El gobierno regional ha aprobado un nuevo paquete de medidas fiscales para 2025 que incluye deducciones en el tramo autonómico del IRPF para aquellos propietarios que realicen obras de mejora energética y accesibilidad en viviendas destinadas al alquiler para jóvenes menores de 35 años.',
    date: '28 Feb 2025',
    source: 'Noticias Sector'
  },

  // MEDIADOS 2025 (Q2 - Q3)
  {
    id: 'n9',
    category: 'Tendencia',
    headline: 'El "Coliving" híbrido gana terreno en el mercado.',
    body: 'El concepto de Coliving se está democratizando. Ya no es necesario un edificio entero operado por una gran empresa. Los pisos compartidos "híbridos", que ofrecen servicios añadidos como limpieza semanal incluida, cuentas de streaming compartidas (Netflix/HBO) y suministros con tarifa plana, se están alquilando en menos de 48 horas frente a las semanas que tardan los pisos tradicionales.',
    date: '15 Mar 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n10',
    category: 'Mercado',
    headline: 'Juan Carlos I dispara precios superando los 400€/mes por habitación.',
    body: 'La zona norte de Murcia sigue su escalada de precios. La calidad de las edificaciones, la seguridad y la conexión con el tranvía han convertido a Juan Carlos I en la "milla de oro" del alquiler por habitaciones. Las habitaciones con baño privado en esta zona ya están rompiendo la barrera de los 400€ mensuales de renta base.',
    date: '10 Abr 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n11',
    category: 'Inversión',
    headline: 'Pisos sin ascensor céntricos sufren corrección: Oportunidad de Cashflow.',
    body: 'Mientras la obra nueva sube, la segunda mano sin ascensor (especialmente terceras y cuartas plantas) está sufriendo una corrección de precio a la baja. Para el inversor enfocado en rentabilidad (cashflow) y no en revalorización, esto representa una oportunidad única: comprar barato en zonas prime y alquilar a estudiantes jóvenes a los que no les importa subir escaleras.',
    date: '05 May 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n12',
    category: 'Regulación',
    headline: 'Endurecimiento de licencias turísticas desvía inversión al alquiler de temporada.',
    body: 'Ante los rumores y borradores de normativas municipales que planean restringir severamente las nuevas licencias de Vivienda de Uso Turístico (VUT) en el centro de Murcia, muchos inversores están pivotando su modelo de negocio hacia el alquiler de media estancia (habitaciones), que ofrece rentabilidades similares con mucha menos carga operativa y regulatoria.',
    date: '20 May 2025',
    source: 'Noticias Sector'
  },

  // FUTURO 2025 (Q4)
  {
    id: 'n13',
    category: 'Mercado',
    headline: 'Stock de alquiler tradicional podría reducirse un 20% adicional.',
    body: 'Las proyecciones para finales de 2025 indican una fuga continua de inventario del mercado de alquiler residencial de larga duración. Si la inseguridad jurídica para el propietario no se resuelve, estimamos que el stock disponible para familias se reducirá un 20% más, trasladándose a la venta o al alquiler temporal.',
    date: '01 Sep 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n14',
    category: 'Inversión',
    headline: 'Alcantarilla y El Palmar: Las nuevas "ciudades dormitorio" rentables.',
    body: 'Con los precios de Murcia capital tensionados, la demanda se desplaza al área metropolitana. Alcantarilla y El Palmar, gracias a sus excelentes conexiones de autobús y servicios propios, están emergiendo como plazas muy rentables para la inversión, con precios de compra un 30-40% inferiores a la capital pero rentas de alquiler muy robustas.',
    date: '15 Sep 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n15',
    category: 'Tendencia',
    headline: 'Digitalización total: Contratos y visitas virtuales.',
    body: 'La visita física está perdiendo peso. Más del 60% de las reservas de habitaciones para el curso 2025-2026 se están cerrando mediante "recorridos virtuales" o videollamadas, y la firma de contratos es ya casi 100% digital. El propietario que no ofrece estas facilidades pierde competitividad, especialmente con el inquilino internacional.',
    date: '01 Oct 2025',
    source: 'Mercado Murcia'
  },

  // EXTRAS
  {
    id: 'n16',
    category: 'Consejo',
    headline: 'El Código Civil protege mejor al propietario en alquiler de temporada.',
    body: 'Es fundamental entender la diferencia legal. Mientras la LAU protege la necesidad de vivienda permanente, el Código Civil regula el arrendamiento de cosas por tiempo determinado. Alquilar por temporada (con causa justificada como estudios o trabajo temporal) permite recuperar la vivienda al fin del contrato sin prórrogas forzosas de 5 años.',
    date: '12 Oct 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n17',
    category: 'Mercado',
    headline: 'La rentabilidad media del alquiler por habitaciones supera el 8,5%.',
    body: 'A pesar de la inflación en los costes de suministros y reformas, el alquiler por habitaciones sigue siendo el rey de la rentabilidad inmobiliaria en Murcia, ofreciendo un retorno neto medio superior al 8,5%, muy por encima de letras del tesoro, bolsa o alquiler tradicional.',
    date: '20 Oct 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n18',
    category: 'Inversión',
    headline: 'Hipotecas "Buy to Rent": La banca se adapta al inversor.',
    body: 'Varias entidades bancarias están lanzando productos específicos para inversores inmobiliarios, que tienen en cuenta no solo los ingresos por nómina del solicitante, sino también la rentabilidad esperada del activo a adquirir para conceder la financiación. Esto facilitará el apalancamiento en 2025.',
    date: '05 Nov 2025',
    source: 'BCE'
  },
  {
    id: 'n19',
    category: 'Tendencia',
    headline: 'Home Staging Virtual para pre-comercializar reformas.',
    body: 'Ya no hace falta esperar a terminar la obra para anunciar el piso. El uso de renders fotorrealistas y Home Staging Virtual permite firmar contratos de alquiler meses antes de que la reforma esté terminada, eliminando los tiempos muertos de vacancia post-obra.',
    date: '15 Nov 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n20',
    category: 'Mercado',
    headline: 'Habitaciones con baño privado: +20% de precio.',
    body: 'La privacidad es el nuevo lujo. La diferencia de precio entre una habitación estándar y una tipo "suite" con baño privado se ha ampliado hasta el 20%. En reformas integrales, priorizar sacar un baño extra es la decisión más rentable que puede tomar un inversor.',
    date: '25 Nov 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n21',
    category: 'Regulación',
    headline: 'Hacienda y el control del alquiler no declarado.',
    body: 'La Agencia Tributaria cruzará datos de consumo eléctrico y plataformas digitales para detectar alquileres sumergidos. La gestión profesional a través de empresas como RentiaRoom garantiza el cumplimiento fiscal y evita sanciones, además de permitir la deducción correcta de todos los gastos operativos.',
    date: '01 Dic 2025',
    source: 'Noticias Sector'
  },
  {
    id: 'n22',
    category: 'Consejo',
    headline: 'Internet de 1Gb: Requisito no negociable.',
    body: 'Hace años, el WiFi era un extra. Hoy es tan importante como el agua caliente. Para atraer a perfiles de calidad (estudiantes de máster, trabajadores), una conexión doméstica básica no sirve. Se requiere fibra de alta velocidad y buena cobertura en todas las estancias.',
    date: '10 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n23',
    category: 'Inversión',
    headline: 'Espinardo: Rey de la rentabilidad estudiantil.',
    body: 'A pesar del auge de otras zonas, Espinardo mantiene su corona gracias a la proximidad física al Campus de la UMU. La demanda es constante y masiva, lo que garantiza una ocupación del 100% durante el curso académico con un esfuerzo de marketing mínimo.',
    date: '15 Dic 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n24',
    category: 'Mercado',
    headline: 'Tiempo medio de ocupación baja a 7 días.',
    body: 'La velocidad del mercado es vertiginosa. Una habitación bien presentada y con precio de mercado en Murcia capital tarda una media de solo 7 días en alquilarse desde su publicación. En RentiaRoom, gracias a nuestra lista de espera, a menudo cerramos el alquiler en menos de 24 horas.',
    date: '20 Dic 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n25',
    category: 'Tendencia',
    headline: 'Auge del "Rent to Rent" para pequeños inversores.',
    body: 'El modelo de subarriendo autorizado (Rent to Rent) está permitiendo a pequeños emprendedores entrar en el sector inmobiliario sin necesidad de comprar activos. Gestionan propiedades de terceros garantizándoles una renta, y obtienen su beneficio de la optimización del alquiler por habitaciones.',
    date: '28 Dic 2025',
    source: 'Noticias Sector'
  }
];
