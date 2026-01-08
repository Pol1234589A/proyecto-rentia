import { JsonLd } from './JsonLd';

export function GlobalBusinessSchema() {
    return (
        <JsonLd
            data={{
                '@context': 'https://schema.org',
                '@type': 'RealEstateAgent',
                name: 'RentiaRoom Murcia',
                alternateName: 'Rentia Investments S.L.',
                url: 'https://www.rentiaroom.com',
                logo: 'https://i.ibb.co/QvzK6db3/Logo-Negativo.png',
                image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
                description: 'Especialistas en Gestión Integral de Alquiler por Habitaciones en Murcia. Maximizamos la rentabilidad de propietarios e inversores con gestión pasiva garantizada.',
                telephone: '+34 672 886 369',
                email: 'info@rentiaroom.com',
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Calle Platería 31',
                    addressLocality: 'Murcia',
                    addressRegion: 'Murcia',
                    postalCode: '30001',
                    addressCountry: 'ES',
                },
                geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 37.9838,
                    longitude: -1.1280,
                },
                areaServed: {
                    '@type': 'City',
                    name: 'Murcia',
                },
                priceRange: '€€',
                sameAs: [
                    'https://www.instagram.com/rentiaroom',
                    'https://www.facebook.com/rentiaroom',
                    'https://www.linkedin.com/company/rentiaroom',
                ],
                openingHoursSpecification: [
                    {
                        '@type': 'OpeningHoursSpecification',
                        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                        opens: '09:00',
                        closes: '20:00',
                    },
                ],
            }}
        />
    );
}
