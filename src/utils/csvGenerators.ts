import { Property } from '../data/rooms';

const downloadCSV = (content: string, filename: string) => {
    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generateContactsCSV = (properties: Property[]) => {
    let csv = 'Propiedad;Rol;Nombre;Teléfono;Email;Habitación\n';

    properties.forEach(prop => {
        // Owner
        if (prop.ownerName) {
            let ownerPhone = prop.ownerPhone || '';
            const address = (prop.address || 'Sin dirección').replace(/"/g, '""');
            const name = (prop.ownerName || '').replace(/"/g, '""');
            csv += `"${address}";"Propietario";"${name}";"${ownerPhone}";"";""\n`;
        }

        // Tenants
        (prop.rooms || []).forEach(room => {
            if (room.tenant) {
                const address = (prop.address || 'Sin dirección').replace(/"/g, '""');
                const name = (room.tenant.name || '').replace(/"/g, '""');
                const roomName = (room.name || '').replace(/"/g, '""');

                csv += `"${address}";"Inquilino";"${name}";"${room.tenant.phone || ''}";"${room.tenant.email || ''}";"${roomName}"\n`;

                if (room.tenant.secondTenant) {
                    const secondName = (room.tenant.secondTenant.name || '').replace(/"/g, '""');
                    csv += `"${address}";"Inquilino (Pareja)";"${secondName}";"${room.tenant.secondTenant.phone || ''}";"${room.tenant.secondTenant.email || ''}";"${roomName}"\n`;
                }
            }
        });
    });

    downloadCSV(csv, `Rentia_Contactos_${new Date().toISOString().split('T')[0]}.csv`);
};

export const generateCleaningCSV = (properties: Property[]) => {
    let csv = 'Propiedad;Limpieza Activada;Limpiadora;Teléfono Limpiadora;Horario;Coste Hora;Incluido en Renta;Notas\n';

    properties.forEach(prop => {
        const config = prop.cleaningConfig;
        const address = (prop.address || 'Sin dirección').replace(/"/g, '""');

        if (config) {
            const cleanerName = (config.cleanerName || 'No asignado').replace(/"/g, '""');
            const cleanerPhone = config.cleanerPhone || '';
            const schedule = `${config.hours || ''} (${(config.days || []).join(', ')})`.replace(/"/g, '""');
            const notes = (config.notes || '').replace(/"/g, '""');

            csv += `"${address}";"${config.enabled ? 'SÍ' : 'NO'}";"${cleanerName}";"${cleanerPhone}";"${schedule}";"${config.costPerHour || 0}€";"${config.included ? 'SÍ' : 'NO'}";"${notes}"\n`;
        } else {
            csv += `"${address}";"NO CONFIGURADO";"";"";"";"";"";""\n`;
        }
    });

    downloadCSV(csv, `Rentia_Estado_Limpieza_${new Date().toISOString().split('T')[0]}.csv`);
};
