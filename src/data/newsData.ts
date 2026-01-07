
export interface NewsItem {
  id: string;
  category: 'Mercado' | 'Regulación' | 'Consejo' | 'Tendencia' | 'Inversión';
  headline: { es: string; en: string };
  body: { es: string; en: string };
  date: string;
  source: 'Analistas Rentia' | 'Mercado Murcia' | 'Noticias Sector' | 'BCE' | 'Idealista Data';
}

export const newsDatabase: NewsItem[] = [
  // DICIEMBRE 2025 - ACTUALIDAD INMEDIATA
  {
    id: 'n1',
    category: 'Mercado',
    headline: {
      es: 'Cierre 2025: El alquiler por habitaciones en Murcia roza el 100% de ocupación técnica.',
      en: '2025 Closing: Room rentals in Murcia reach almost 100% technical occupancy.'
    },
    body: {
      es: 'A 15 de diciembre, el stock disponible de habitaciones de calidad en Murcia capital es prácticamente nulo. La demanda de estudiantes internacionales para el segundo cuatrimestre y la retención de trabajadores jóvenes han creado un cuello de botella, elevando los precios un 5% en el último mes del año.',
      en: 'As of December 15, the available stock of quality rooms in Murcia city is practically zero. Demand from international students for the second semester and the retention of young workers have created a bottleneck, raising prices by 5% in the last month of the year.'
    },
    date: '15 Dic 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n2',
    category: 'Inversión',
    headline: {
      es: 'Espinardo se consolida como el barrio más rentable para inversores en 2025.',
      en: 'Espinardo consolidates as the most profitable neighborhood for investors in 2025.'
    },
    body: {
      es: 'El informe anual de Rentia confirma que Espinardo ha ofrecido la mejor relación precio de compra / ingreso por alquiler de todo 2025, superando el 9% de rentabilidad bruta en activos reformados, impulsado por la cercanía al Campus de la UMU y la conexión de tranvía.',
      en: 'Rentia\'s annual report confirms that Espinardo offered the best purchase price / rental income ratio of all 2025, exceeding 9% gross yield on renovated assets, driven by proximity to the UMU Campus and tram connection.'
    },
    date: '14 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n3',
    category: 'Regulación',
    headline: {
      es: 'Aprobada la nueva deducción autonómica para propietarios que alquilen a jóvenes en 2026.',
      en: 'New regional deduction approved for owners renting to young people in 2026.'
    },
    body: {
      es: 'La Asamblea Regional ha dado luz verde a los presupuestos de 2026, incluyendo una deducción en el tramo autonómico del IRPF para arrendadores que ofrezcan contratos de larga estancia a menores de 35 años, incentivando así la estabilidad frente al alquiler turístico.',
      en: 'The Regional Assembly has greenlighted the 2026 budget, including a deduction in the regional income tax bracket for landlords offering long-term contracts to under-35s, incentivizing stability over tourist rentals.'
    },
    date: '12 Dic 2025',
    source: 'Noticias Sector'
  },
  {
    id: 'n4',
    category: 'Tendencia',
    headline: {
      es: 'El "Coliving Senior" empieza a despuntar tímidamente en la zona norte de Murcia.',
      en: '"Senior Coliving" begins to timidly emerge in the north of Murcia.'
    },
    body: {
      es: 'No solo estudiantes. Detectamos una tendencia creciente de profesionales mayores de 40 años y personas separadas que buscan habitaciones de alto standing en Juan Carlos I, priorizando la comunidad y servicios premium sobre la soledad de un apartamento individual.',
      en: 'Not just students. We detect a growing trend of professionals over 40 and separated individuals seeking high-standing rooms in Juan Carlos I, prioritizing community and premium services over the solitude of a single apartment.'
    },
    date: '10 Dic 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n5',
    category: 'Consejo',
    headline: {
      es: 'Preparando el piso para enero: Claves para captar estudiantes de máster.',
      en: 'Preparing the flat for January: Keys to attracting master\'s students.'
    },
    body: {
      es: 'Enero es la segunda "temporada alta". Para atraer a estudiantes de postgrado que llegan en el segundo cuatrimestre, es vital ofrecer escritorios amplios, sillas ergonómicas de calidad y asegurar un ambiente de estudio tranquilo en la vivienda.',
      en: 'January is the second "high season". To attract postgraduate students arriving in the second semester, it is vital to offer large desks, quality ergonomic chairs, and ensure a quiet study environment in the home.'
    },
    date: '08 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n6',
    category: 'Mercado',
    headline: {
      es: 'El precio medio de la habitación premium supera los 380€ en el centro.',
      en: 'Average premium room price exceeds €380 in the center.'
    },
    body: {
      es: 'La inflación y la mejora en las calidades de las reformas han empujado el precio medio. Las habitaciones con cama doble, aire acondicionado y baño privado en zonas como Santa Eulalia o San Lorenzo ya no bajan de los 380-400€ mensuales más gastos.',
      en: 'Inflation and improved renovation qualities have pushed the average price up. Rooms with double beds, air conditioning, and private bathrooms in areas like Santa Eulalia or San Lorenzo no longer drop below €380-400 monthly plus expenses.'
    },
    date: '05 Dic 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n7',
    category: 'Inversión',
    headline: {
      es: 'La llegada de nuevas empresas tecnológicas al Parque Científico dispara la demanda en La Ñora.',
      en: 'Arrival of new tech companies at Science Park boosts demand in La Ñora.'
    },
    body: {
      es: 'La Ñora y Guadalupe ya no son solo territorio UCAM. La instalación de dos multinacionales tecnológicas en el parque empresarial cercano ha traído una oleada de ingenieros jóvenes que buscan alojamiento de calidad cerca del trabajo, diversificando el riesgo del inversor.',
      en: 'La Ñora and Guadalupe are no longer just UCAM territory. The installation of two tech multinationals in the nearby business park has brought a wave of young engineers seeking quality accommodation close to work, diversifying investor risk.'
    },
    date: '01 Dic 2025',
    source: 'Noticias Sector'
  },
  
  // NOVIEMBRE 2025 - HISTÓRICO RECIENTE
  {
    id: 'n8',
    category: 'Regulación',
    headline: {
      es: 'Hacienda intensificará el control de alquileres turísticos en 2026.',
      en: 'Tax Agency to intensify control of tourist rentals in 2026.'
    },
    body: {
      es: 'Se filtra el plan de control tributario para el próximo año. El foco estará puesto en las plataformas de alquiler vacacional y el cruce de datos de consumo eléctrico para detectar falsos alquileres de temporada que encubren actividad turística sin licencia.',
      en: 'The tax control plan for next year is leaked. The focus will be on vacation rental platforms and cross-referencing electricity consumption data to detect fake seasonal rentals covering up unlicensed tourist activity.'
    },
    date: '28 Nov 2025',
    source: 'Noticias Sector'
  },
  {
    id: 'n9',
    category: 'Tendencia',
    headline: {
      es: 'Las visitas virtuales ya cierran el 70% de los alquileres internacionales.',
      en: 'Virtual tours now close 70% of international rentals.'
    },
    body: {
      es: 'El inquilino internacional ya no viaja para ver el piso. Confía en el video tour y la reputación de la agencia. En RentiaRoom, 7 de cada 10 contratos con estudiantes extranjeros para 2026 se han firmado sin visita física.',
      en: 'International tenants no longer travel to see the apartment. They rely on video tours and agency reputation. At RentiaRoom, 7 out of 10 contracts with foreign students for 2026 have been signed without a physical visit.'
    },
    date: '25 Nov 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n10',
    category: 'Consejo',
    headline: {
      es: 'Seguros de impago: ¿Son necesarios en el alquiler de habitaciones?',
      en: 'Default insurance: Is it necessary for room rentals?'
    },
    body: {
      es: 'Aunque la morosidad en habitaciones es muy baja (<1%), la tranquilidad cotiza al alza. Recomendamos seguros específicos para coliving que cubren no solo el impago individual, sino también daños por vandalismo en zonas comunes, algo que el seguro de hogar tradicional suele excluir.',
      en: 'Although delinquency in rooms is very low (<1%), peace of mind is valued. We recommend specific coliving insurance that covers not only individual default but also vandalism damages in common areas, something traditional home insurance usually excludes.'
    },
    date: '20 Nov 2025',
    source: 'Analistas Rentia'
  },
  
  // EXTRAS DE DICIEMBRE Y PREVISIONES
  {
    id: 'n11',
    category: 'Mercado',
    headline: {
      es: 'Escasez de oferta de alquiler tradicional empuja a familias al alquiler compartido.',
      en: 'Shortage of traditional rental supply pushes families into shared rental.'
    },
    body: {
      es: 'Un fenómeno preocupante: empezamos a ver familias monoparentales o parejas buscando habitaciones grandes en pisos compartidos debido a la imposibilidad de acceder a un piso completo por la falta de stock y precios disparados.',
      en: 'A worrying phenomenon: we are starting to see single-parent families or couples looking for large rooms in shared apartments due to the impossibility of accessing a whole apartment due to lack of stock and skyrocketing prices.'
    },
    date: '15 Dic 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n12',
    category: 'Inversión',
    headline: {
      es: 'Oportunidad: Locales comerciales convertidos a vivienda en El Carmen.',
      en: 'Opportunity: Commercial premises converted to housing in El Carmen.'
    },
    body: {
      es: 'Con el cambio de normativa municipal facilitando el cambio de uso, los bajos comerciales en calles secundarias del Barrio del Carmen se están transformando en viviendas tipo loft de alta rentabilidad. Un nicho a explorar antes de que se sature.',
      en: 'With the change in municipal regulations facilitating change of use, commercial ground floors in secondary streets of Barrio del Carmen are being transformed into high-yield loft-type housing. A niche to explore before it saturates.'
    },
    date: '13 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n13',
    category: 'Tendencia',
    headline: {
      es: 'Sostenibilidad: Los inquilinos valoran cada vez más la eficiencia energética.',
      en: 'Sustainability: Tenants increasingly value energy efficiency.'
    },
    body: {
      es: 'Ante la subida de la luz, los inquilinos preguntan activamente por el aislamiento, ventanas climalit y electrodomésticos eficientes. Pisos con mala calificación energética están sufriendo mayor rotación por el alto coste de suministros para el inquilino.',
      en: 'Given the rise in electricity prices, tenants are actively asking about insulation, double-glazed windows, and efficient appliances. Apartments with poor energy ratings are suffering higher turnover due to the high cost of utilities for the tenant.'
    },
    date: '11 Dic 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n14',
    category: 'Consejo',
    headline: {
      es: 'Cómo gestionar la convivencia entre estudiantes y trabajadores en el mismo piso.',
      en: 'How to manage coexistence between students and workers in the same flat.'
    },
    body: {
      es: 'El piso mixto es posible, pero requiere normas claras. Clave: horarios de silencio nocturno estrictos y zonas de estudio/trabajo diferenciadas del ocio. Recomendamos agrupar perfiles similares siempre que sea posible para evitar fricciones.',
      en: 'The mixed flat is possible, but requires clear rules. Key: strict night silence schedules and study/work areas differentiated from leisure. We recommend grouping similar profiles whenever possible to avoid friction.'
    },
    date: '09 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n15',
    category: 'Regulación',
    headline: {
      es: 'Actualización IPC 2026: Previsiones para la actualización de rentas.',
      en: 'CPI 2026 Update: Forecasts for rent updates.'
    },
    body: {
      es: 'El INE adelanta que el IPC cerrará 2025 en el entorno del 3,2%. Los contratos de habitaciones, al no estar sujetos al tope del 3% de la Ley de Vivienda (salvo pacto en contrario), podrán actualizarse conforme al IPC real, protegiendo el poder adquisitivo del propietario.',
      en: 'The INE anticipates that the CPI will close 2025 around 3.2%. Room contracts, not being subject to the 3% cap of the Housing Law (unless agreed otherwise), can be updated according to the real CPI, protecting the owner\'s purchasing power.'
    },
    date: '07 Dic 2025',
    source: 'BCE'
  },
  {
    id: 'n16',
    category: 'Mercado',
    headline: {
      es: 'UCAM bate récord de matriculaciones para el segundo cuatrimestre.',
      en: 'UCAM breaks enrollment record for the second semester.'
    },
    body: {
      es: 'La universidad privada confirma un aumento del 20% en estudiantes de intercambio procedentes de Italia y Francia para empezar en Febrero. La demanda de habitaciones en la zona norte se disparará pasadas las fiestas navideñas.',
      en: 'The private university confirms a 20% increase in exchange students from Italy and France starting in February. Demand for rooms in the north zone will skyrocket after the Christmas holidays.'
    },
    date: '14 Dic 2025',
    source: 'Mercado Murcia'
  },
  {
    id: 'n17',
    category: 'Inversión',
    headline: {
      es: 'Juan Carlos I: Precios de compra estabilizados, rentabilidad en aumento.',
      en: 'Juan Carlos I: Purchase prices stabilized, profitability increasing.'
    },
    body: {
      es: 'Tras dos años de subidas, el precio de venta en la Avenida Juan Carlos I se ha estabilizado, mientras que el alquiler sigue subiendo. Es el momento "dulce" para entrar en este mercado premium antes de una nueva revalorización.',
      en: 'After two years of increases, the sale price on Juan Carlos I Avenue has stabilized, while rent continues to rise. It is the "sweet" moment to enter this premium market before a new revaluation.'
    },
    date: '12 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n18',
    category: 'Tendencia',
    headline: {
      es: 'Mobiliario inteligente y domótica: El nuevo estándar en habitaciones de lujo.',
      en: 'Smart furniture and home automation: The new standard in luxury rooms.'
    },
    body: {
      es: 'Cerraduras electrónicas con código, luces regulables por app y escritorios elevables. Los inquilinos premium valoran la tecnología y están dispuestos a pagar un extra por la comodidad y seguridad que ofrece la domótica.',
      en: 'Electronic code locks, app-dimmable lights, and standing desks. Premium tenants value technology and are willing to pay extra for the comfort and security that home automation offers.'
    },
    date: '10 Dic 2025',
    source: 'Idealista Data'
  },
  {
    id: 'n19',
    category: 'Consejo',
    headline: {
      es: 'Limpieza profesional semanal: El secreto para retener inquilinos de calidad.',
      en: 'Weekly professional cleaning: The secret to retaining quality tenants.'
    },
    body: {
      es: 'Nuestros datos lo confirman: los pisos con servicio de limpieza incluido tienen una rotación un 40% menor. Los conflictos por la limpieza son la causa nº1 de abandono. Eliminar ese factor fideliza al inquilino.',
      en: 'Our data confirms it: apartments with included cleaning service have 40% lower turnover. Cleaning conflicts are the #1 cause of abandonment. Eliminating that factor builds tenant loyalty.'
    },
    date: '06 Dic 2025',
    source: 'Analistas Rentia'
  },
  {
    id: 'n20',
    category: 'Mercado',
    headline: {
      es: 'Ranking 2025: Murcia entra en el Top 3 de ciudades españolas más rentables para invertir.',
      en: '2025 Ranking: Murcia enters Top 3 most profitable Spanish cities to invest.'
    },
    body: {
      es: 'Solo superada por Lleida, Murcia capital se posiciona como el tercer mejor destino nacional para la inversión en vivienda para alquiler, gracias a la combinación de precios de suelo accesibles y una demanda de alquiler en máximos históricos.',
      en: 'Only surpassed by Lleida, Murcia city positions itself as the third best national destination for investment in rental housing, thanks to the combination of affordable land prices and rental demand at historic highs.'
    },
    date: '03 Dic 2025',
    source: 'Noticias Sector'
  }
];
