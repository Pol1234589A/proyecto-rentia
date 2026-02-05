import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Property, Room } from '../data/rooms';
import { UserProfile } from '../types';

export interface ExcelOptions {
    includeTenantInfo: boolean;
    includeFinancials: boolean;
    includeOwnerInfo: boolean;
    includeCleaningInfo: boolean;
    includeTimelines: boolean; // This will trigger the Audit History tabs
    includeIncidents: boolean; // This will add the Incidents tab
    includeCommercial: boolean; // This will add the Availability tab
    groupBy: 'none' | 'city' | 'status' | 'topic';
}

const applyHeaderStyle = (row: ExcelJS.Row) => {
    row.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
    row.height = 30;
};

const applySubHeaderStyle = (row: ExcelJS.Row) => {
    row.font = { bold: true, size: 11, color: { argb: 'FF334155' } }; // Slate 700
    row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // Slate 100
    };
    row.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row.height = 25;
    row.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
};

const getColumns = (options: ExcelOptions) => {
    const columns = [
        { header: 'Propiedad', key: 'property', width: 30 },
        { header: 'ID Interno', key: 'id', width: 15 },
        { header: 'Habitación', key: 'room', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Fin Contrato', key: 'contractEndDate', width: 15 },
        { header: 'Disponibilidad', key: 'availableFrom', width: 15 },
    ];

    if (options.includeFinancials) {
        columns.push(
            { header: 'Precio', key: 'price', width: 12 },
            { header: 'Gastos', key: 'expenses', width: 25 },
            { header: 'Fianza', key: 'deposit', width: 12 },
            { header: 'Comisión %', key: 'commissionPercent', width: 12 },
            { header: 'Beneficio Mes (€)', key: 'commissionAmount', width: 15 },
            { header: 'Flujo Pago', key: 'paymentFlow', width: 20 },
            { header: 'Día Liq.', key: 'transferDay', width: 10 },
            { header: 'Banco Propietario', key: 'bankAccount', width: 25 },
            { header: 'Titular Banco', key: 'bankAccountHolder', width: 25 },
            { header: 'Destino Recibos', key: 'receiptDest', width: 15 },
            { header: 'WA Grupo/Prop', key: 'receiptLink', width: 20 }
        );
    }

    if (options.includeTenantInfo) {
        columns.push(
            { header: 'Inquilino', key: 'tenantName', width: 25 },
            { header: 'Teléfono', key: 'tenantPhone', width: 15 },
            { header: 'Email', key: 'tenantEmail', width: 25 },
            { header: '2º Inquilino', key: 'secondTenant', width: 25 },
            { header: 'Inicio', key: 'startDate', width: 12 },
            { header: 'Fin', key: 'endDate', width: 12 },
            { header: 'Contrato', key: 'contract', width: 15 }
        );
    }

    if (options.includeCleaningInfo) {
        columns.push(
            { header: 'Limpieza', key: 'cleanerName', width: 20 },
            { header: 'Tel. Limpieza', key: 'cleanerPhone', width: 15 },
            { header: 'Horario', key: 'cleanerSchedule', width: 20 },
            { header: 'Coste', key: 'cleanerCost', width: 12 },
            { header: 'Pago', key: 'cleanerPayment', width: 15 }
        );
    }

    if (options.includeOwnerInfo) {
        columns.push(
            { header: 'Propietario', key: 'ownerName', width: 25 },
            { header: 'Teléfono Prop.', key: 'ownerPhone', width: 15 },
            { header: 'Llaves / Copias', key: 'keysLocation', width: 20 }
        );
    }

    columns.push({ header: 'Notas / Incidencias', key: 'notes', width: 40 });

    return columns;
};

const autoSizeColumns = (worksheet: ExcelJS.Worksheet) => {
    worksheet.columns.forEach((column) => {
        if (!column) return;
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
            // Ignore merged cells completely for width calculation to prevent headers from distorting columns
            if (cell.isMerged) return;

            let cellLength = 0;
            if (cell.value) {
                if (typeof cell.value === 'object' && 'text' in cell.value) {
                    // Hyperlink: count text length
                    cellLength = (cell.value as any).text.toString().length;
                } else {
                    cellLength = cell.value.toString().length;
                }
            }
            if (cellLength > maxLength) {
                maxLength = cellLength;
            }
        });

        // Set width: Min 10, Max 60, Padding 1.2
        const desiredWidth = maxLength + 2;
        column.width = Math.min(Math.max(desiredWidth, 10), 60);
    });
};

const isDatePast = (dateStr?: string) => {
    if (!dateStr || dateStr === 'Consultar' || dateStr === 'Inmediata') return false;
    try {
        const parts = dateStr.split('/');
        if (parts.length !== 3) return false;
        const [day, month, year] = parts.map(Number);
        const target = new Date(year, month - 1, day, 23, 59, 59);
        return target < new Date();
    } catch (e) { return false; }
};

const addPropertyRows = (worksheet: ExcelJS.Worksheet, properties: Property[], options: ExcelOptions, userDataMap?: Record<string, any>) => {
    let currentRowIndex = 2; // Start after header

    properties.forEach(property => {
        // Property Header Row
        const propertyRow = worksheet.getRow(currentRowIndex);
        const commBase = property.managementCommission ?? 10;
        const cityNorm = (property.city || 'Otros').replace(/\(Murcia\)/gi, '').trim();
        const floorInfo = property.floor ? ` [${property.floor}]` : '';
        propertyRow.getCell(1).value = `${property.address}${floorInfo} (${cityNorm}) - Gestión: ${commBase}% ${property.commissionIncludesIVA ? '(IVA Inc.)' : '+ IVA'}`;
        applySubHeaderStyle(propertyRow);
        worksheet.mergeCells(`A${currentRowIndex}:${String.fromCharCode(65 + worksheet.columns.length - 1)}${currentRowIndex}`);
        currentRowIndex++;

        (property.rooms || []).forEach((room, roomIdx) => {
            const row = worksheet.getRow(currentRowIndex);

            // Basic Info
            // Only show address on the first room of the block for cleaner look
            row.getCell('property').value = roomIdx === 0 ? property.address : '';
            row.getCell('id').value = property.id;
            row.getCell('room').value = room.name;

            // Source of truth for date: tenant end date if occupied, or availableFrom
            const tenantEndDate = room.tenant?.endDate || '-';
            // Logic: if occupied, availability is the contract end date (unless next availability is explicitly set)
            const availabilityDate = room.status === 'occupied'
                ? (tenantEndDate !== '-' ? tenantEndDate : 'Consultar')
                : (room.availableFrom || 'Inmediata');

            row.getCell('contractEndDate').value = tenantEndDate;
            row.getCell('availableFrom').value = (room.status === 'occupied' && availabilityDate === 'Inmediata') ? 'Ocupada' : availabilityDate;

            // Status
            const statusCell = row.getCell('status');
            let statusLabel = 'LIBRE';
            let statusColor = 'FF10B981'; // Emerald 500

            if (room.status === 'occupied') {
                const isExpired = isDatePast(tenantEndDate !== '-' ? tenantEndDate : undefined);
                statusLabel = isExpired ? 'VENCIDO' : 'ALQUILADA';
                statusColor = isExpired ? 'FFFF8C00' : 'FF64748B';
            }
            if (room.status === 'reserved') { statusLabel = 'RESERVADA'; statusColor = 'FFF59E0B'; } // Amber 500
            if (room.isNonPayment) { statusLabel = 'IMPAGO'; statusColor = 'FFEF4444'; } // Red 500

            statusCell.value = statusLabel;
            statusCell.font = { color: { argb: statusColor }, bold: true };

            // Financials
            if (options.includeFinancials) {
                row.getCell('price').value = room.price;
                row.getCell('expenses').value = room.expenses || '-';
                row.getCell('deposit').value = room.tenant?.deposit || 0;

                // Calculate abstract commission/profit
                const basePrice = Math.max(0, (room.price || 0) - (property.commissionBaseDeduction || 0));
                const baseComm = room.commissionValue ?? property.managementCommission ?? 10;
                const isPercentage = room.commissionType !== 'fixed';

                let profitAmount = isPercentage ? (basePrice * (baseComm / 100)) : baseComm;
                if (!property.commissionIncludesIVA) profitAmount *= 1.21;

                row.getCell('commissionPercent').value = isPercentage ? `${baseComm}%` : `${baseComm}€`;
                // If payment directly to owner, Rentia still profits the commission, so we show it, but maybe we mark it?
                // Actually the profit is the same.
                row.getCell('commissionAmount').value = room.status === 'occupied' && !room.isNonPayment ? profitAmount : 0;

                const flowLabel = property.paymentFlow === 'tenant_rentia_owner'
                    ? 'Inq -> Rentia -> Prop'
                    : property.paymentFlow === 'tenant_owner_rentia'
                        ? 'Inq -> Prop -> Rentia'
                        : 'No definido';

                row.getCell('paymentFlow').value = flowLabel;
                row.getCell('transferDay').value = property.transferDay || '-';
                row.getCell('bankAccount').value = property.bankAccount || '-';
                row.getCell('bankAccountHolder').value = property.bankAccountHolder || '-';
                row.getCell('receiptDest').value = property.receiptDest === 'group' ? 'WhatsApp Grupo' : property.receiptDest === 'private' ? 'Propietario' : '-';

                if (property.receiptLink) {
                    row.getCell('receiptLink').value = { text: 'Abrir Contacto', hyperlink: property.receiptLink };
                } else {
                    row.getCell('receiptLink').value = '-';
                }
            }

            // Tenant
            if (options.includeTenantInfo) {
                row.getCell('tenantName').value = room.tenant?.name || '-';
                row.getCell('tenantPhone').value = room.tenant?.phone || '-';
                row.getCell('tenantEmail').value = room.tenant?.email || '-';
                row.getCell('secondTenant').value = room.tenant?.secondTenant ? `${room.tenant.secondTenant.name} (${room.tenant.secondTenant.phone || ''})` : '-';
                row.getCell('startDate').value = room.tenant?.startDate || '-';
                row.getCell('endDate').value = room.tenant?.endDate || '-';

                // Drive Link
                if (room.driveUrl) {
                    row.getCell('contract').value = { text: 'Ver Drive', hyperlink: room.driveUrl };
                    row.getCell('contract').font = { underline: true, color: { argb: 'FF2563EB' } }; // Blue link
                } else {
                    row.getCell('contract').value = '-';
                }
            }

            // Cleaning Info
            if (options.includeCleaningInfo) {
                if (property.cleaningConfig?.enabled) {
                    row.getCell('cleanerName').value = property.cleaningConfig.cleanerName || 'Sin Asignar';
                    row.getCell('cleanerPhone').value = property.cleaningConfig.cleanerPhone || '-';

                    const days = (property.cleaningConfig.days || []).join(', ');
                    row.getCell('cleanerSchedule').value = `${days} (${property.cleaningConfig.hours || '?'})`;

                    row.getCell('cleanerCost').value = `${property.cleaningConfig.costPerHour || 0} €/h`;
                    row.getCell('cleanerPayment').value = `${property.cleaningConfig.paymentMethod || 'Efectivo'} (${property.cleaningConfig.paymentDay || 'Fin mes'})`;
                } else {
                    row.getCell('cleanerName').value = 'No Contratado';
                    row.getCell('cleanerSchedule').value = '-';
                    row.getCell('cleanerCost').value = '-';
                    row.getCell('cleanerPayment').value = '-';
                }
            }

            // Owner Info
            if (options.includeOwnerInfo) {
                // Prioritize explicit property fields, fallback to owner map
                const ownerFromMap = (userDataMap && property.ownerId) ? userDataMap[property.ownerId] : null;

                row.getCell('ownerName').value = property.ownerName || ownerFromMap?.name || '-';
                row.getCell('ownerPhone').value = property.ownerPhone || ownerFromMap?.phone || '-';

                // Keys info logic
                let keysInfo = 'En Oficina';
                if (property.internalNotes?.toLowerCase().includes('llaves')) keysInfo = 'Ver Notas';
                row.getCell('keysLocation').value = keysInfo;
            }

            // Notes / Incidencias Column (Cleaned up)
            const notes = [];
            if (property.internalNotes) notes.push(`[Prop] ${property.internalNotes}`);
            if (room.notes) notes.push(`[Hab] ${room.notes}`);

            // We NO LONGER include the full history/timeline here if generateFullHistoryReport is intended for that
            // But we keep critical real-time status alerts
            if (room.isNonPayment) notes.push('⚠️ ¡IMPAGO!');
            if (isDatePast(room.availableFrom) && room.status === 'occupied') notes.push('⚠️ CONTRATO VENCIDO');

            notes.push('→ Ver historial completo en reporte Historial/Audit.');

            row.getCell('notes').value = notes.join('\n');

            // Styling
            row.alignment = { vertical: 'top', wrapText: true, horizontal: 'left' };
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
            });

            // Financial Formatting
            if (options.includeFinancials) {
                row.getCell('price').numFmt = '#,##0.00 "€"';
                row.getCell('deposit').numFmt = '#,##0.00 "€"';
                row.getCell('commissionAmount').numFmt = '#,##0.00 "€"';
            }

            currentRowIndex++;
        });

        // Property Summary Row
        if (options.includeFinancials) {
            const summaryRow = worksheet.getRow(currentRowIndex);

            let propTotalProfit = 0;
            (property.rooms || []).forEach(r => {
                if (r.status === 'occupied' && !r.isNonPayment) {
                    const baseComm = r.commissionValue ?? property.managementCommission ?? 10;
                    const isPercentage = r.commissionType !== 'fixed';
                    let profitAmount = isPercentage ? ((r.price || 0) * (baseComm / 100)) : baseComm;
                    if (!property.commissionIncludesIVA) profitAmount *= 1.21;
                    propTotalProfit += profitAmount;
                }
            });

            summaryRow.getCell(1).value = `SUBTOTAL ${property.address}`;
            summaryRow.getCell('commissionAmount').value = propTotalProfit;
            summaryRow.getCell('commissionAmount').numFmt = '#,##0.00 "€"';
            summaryRow.getCell('commissionAmount').font = { bold: true, color: { argb: 'FF10B981' } };

            summaryRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8FAFC' } // Very light slate
            };
            summaryRow.getCell(1).alignment = { horizontal: 'right' };
            summaryRow.height = 25;

            // Border for summary
            summaryRow.eachCell((cell) => {
                cell.border = {
                    top: { style: 'double', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } }
                };
            });

            currentRowIndex++;
        }
    });
};

export const generateExcelReport = async (
    properties: Property[],
    options: ExcelOptions,
    userDataMap?: Record<string, any>
) => {
    const workbook = new ExcelJS.Workbook();
    const sortedProps = [...properties].sort((a, b) => (a.address || '').localeCompare(b.address || ''));

    if (options.groupBy === 'topic') {
        // TOPIC MODE: Specialized thematic sheets
        const statusOpts = { ...options, includeFinancials: false, includeTenantInfo: false, includeOwnerInfo: false, includeCleaningInfo: false };
        const sheetStatus = workbook.addWorksheet('Estado General');
        sheetStatus.columns = getColumns(statusOpts);
        applyHeaderStyle(sheetStatus.getRow(1));
        addPropertyRows(sheetStatus, sortedProps, statusOpts, userDataMap);
        autoSizeColumns(sheetStatus);

        if (options.includeFinancials) {
            const finOpts = { ...options, includeFinancials: true, includeTenantInfo: false, includeOwnerInfo: false, includeCleaningInfo: false };
            const sheetFin = workbook.addWorksheet('Financiero');
            sheetFin.columns = getColumns(finOpts);
            applyHeaderStyle(sheetFin.getRow(1));
            addPropertyRows(sheetFin, sortedProps, finOpts, userDataMap);
            autoSizeColumns(sheetFin);
        }

        if (options.includeTenantInfo || options.includeOwnerInfo) {
            const contactOpts = { ...options, includeFinancials: false, includeTenantInfo: options.includeTenantInfo, includeOwnerInfo: options.includeOwnerInfo, includeCleaningInfo: false };
            const sheetContacts = workbook.addWorksheet('Agenda Contactos');
            sheetContacts.columns = getColumns(contactOpts);
            applyHeaderStyle(sheetContacts.getRow(1));
            addPropertyRows(sheetContacts, sortedProps, contactOpts, userDataMap);
            autoSizeColumns(sheetContacts);
        }

        if (options.includeCleaningInfo) {
            const serviceOpts = { ...options, includeFinancials: false, includeTenantInfo: false, includeOwnerInfo: false, includeCleaningInfo: true };
            const sheetServices = workbook.addWorksheet('Limpieza y Servicios');
            sheetServices.columns = getColumns(serviceOpts);
            applyHeaderStyle(sheetServices.getRow(1));
            addPropertyRows(sheetServices, sortedProps, serviceOpts, userDataMap);
            autoSizeColumns(sheetServices);
        }
    } else {
        // GROUPED MODE: City or All-in-one
        let sheetsMap: Record<string, Property[]> = {};
        if (options.groupBy === 'city') {
            sortedProps.forEach(p => {
                const city = (p.city || 'Otros').replace(/\(Murcia\)/gi, '').trim();
                if (!sheetsMap[city]) sheetsMap[city] = [];
                sheetsMap[city].push(p);
            });
        } else {
            sheetsMap['Listado Maestro'] = sortedProps;
        }

        Object.keys(sheetsMap).forEach(sheetName => {
            const worksheet = workbook.addWorksheet(sheetName);
            worksheet.columns = getColumns(options);
            applyHeaderStyle(worksheet.getRow(1));
            addPropertyRows(worksheet, sheetsMap[sheetName], options, userDataMap);
            autoSizeColumns(worksheet);
        });
    }

    // --- CONDITIONAL MASTER ADD-ONS ---

    // 1. Business Intelligence (Summary)
    if (options.includeFinancials) {
        addFinancialSummarySheet(workbook, sortedProps);
    }

    // 2. Incidents & Maintenance
    if (options.includeIncidents) {
        const sheetInc = workbook.addWorksheet('Incidencias y Tareas');
        populateIncidentsData(sheetInc, sortedProps);
    }

    // 3. Commercial Availability
    if (options.includeCommercial) {
        const sheetAv = workbook.addWorksheet('Disponibilidad Próxima');
        populateAvailabilityData(sheetAv, sortedProps);
    }

    // 4. Audit Trail (One sheet per property)
    if (options.includeTimelines) {
        const usersList = userDataMap ? Object.values(userDataMap) : [];
        addAuditTrailSheets(workbook, sortedProps, usersList);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `REPORTE_ADMIN_RENTIA_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
};

// --- INTERNAL HELPERS FOR UNIFIED REPORT ---

const addFinancialSummarySheet = (workbook: ExcelJS.Workbook, properties: Property[]) => {
    const ws = workbook.addWorksheet('Resumen de Negocio');
    ws.columns = [{ header: 'Métrica', key: 'm', width: 45 }, { header: 'Valor', key: 'v', width: 25 }];
    applyHeaderStyle(ws.getRow(1));

    let totalPotential = 0, totalOccupied = 0, totalProfit = 0, totalRooms = 0, occupiedCount = 0;
    properties.forEach(p => {
        (p.rooms || []).forEach(r => {
            totalRooms++;
            if (r.price) totalPotential += r.price;
            if (r.status === 'occupied' && r.tenant) {
                occupiedCount++;
                totalOccupied += r.price || 0;
                const basePrice = Math.max(0, (r.price || 0) - (p.commissionBaseDeduction || 0));
                const baseCommValue = r.commissionValue ?? p.managementCommission ?? 10;
                const isPerc = r.commissionType !== 'fixed';
                let profit = isPerc ? (basePrice * (baseCommValue / 100)) : baseCommValue;
                if (!p.commissionIncludesIVA) profit *= 1.21;
                if (!r.isNonPayment) totalProfit += profit;
            }
        });
    });

    const data = [
        ['Total Propiedades Bajo Gestión', properties.length],
        ['Total Habitaciones Disponibles', totalRooms],
        ['Habitaciones Ocupadas Actuales', occupiedCount],
        ['Tasa de Ocupación', `${Math.round((occupiedCount / (totalRooms || 1)) * 100)}%`],
        ['', ''],
        ['Facturación Bruta Potencial (100% Ocupado)', totalPotential],
        ['Facturación Bruta Actual (Real)', totalOccupied],
        ['BENEFICIO NETO RENTIA ESTIMADO (MES)', totalProfit],
        ['Rentabilidad Media por Habitación', totalProfit / (occupiedCount || 1)]
    ];

    data.forEach((row, i) => {
        const r = ws.getRow(i + 2);
        r.values = row;
        if (typeof row[1] === 'number' && i > 4) r.getCell(2).numFmt = '#,##0.00 "€"';
        if (i === 7) r.font = { bold: true, size: 12, color: { argb: 'FF10B981' } };
    });
    autoSizeColumns(ws);
};

const populateIncidentsData = (ws: ExcelJS.Worksheet, properties: Property[]) => {
    ws.columns = [
        { header: 'Fecha', key: 'd', width: 15 },
        { header: 'Propiedad', key: 'p', width: 30 },
        { header: 'Hab.', key: 'r', width: 10 },
        { header: 'Inquilino', key: 't', width: 20 },
        { header: 'Evento', key: 'e', width: 15 },
        { header: 'Descripción', key: 'desc', width: 60 }
    ];
    applyHeaderStyle(ws.getRow(1));
    let idx = 2;
    properties.forEach(p => {
        const allEvt = [
            ...((p.timeline || []).filter(e => e.type === 'incident' || e.type === 'maintenance').map(e => ({ ...e, o: 'GENERAL' }))),
            ...((p.rooms || []).flatMap(room => (room.timeline || []).filter(e => e.type === 'incident' || e.type === 'maintenance').map(e => ({ ...e, o: room.name, tenant: room.tenant?.name }))))
        ];
        allEvt.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        allEvt.forEach(evt => {
            const row = ws.getRow(idx++);
            row.values = [evt.date, p.address, evt.o, (evt as any).tenant || '-', evt.type.toUpperCase(), evt.text];
            if (evt.type === 'incident') row.getCell(5).font = { color: { argb: 'FFEF4444' }, bold: true };
        });
    });
    autoSizeColumns(ws);
};

const populateAvailabilityData = (ws: ExcelJS.Worksheet, properties: Property[]) => {
    ws.columns = [
        { header: 'Vivienda', key: 'address', width: 30 },
        { header: 'Hab.', key: 'room', width: 10 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Hasta', key: 'end', width: 15 },
        { header: 'Disponible', key: 'avail', width: 15 },
        { header: 'Precio', key: 'price', width: 12 }
    ];
    applyHeaderStyle(ws.getRow(1));
    let idx = 2;
    properties.forEach(p => {
        (p.rooms || []).forEach(r => {
            if (r.status === 'available' || (r.status === 'occupied' && r.availableFrom)) {
                ws.getRow(idx++).values = [p.address, r.name, r.status === 'available' ? 'LIBRE' : 'OCUPADA', r.tenant?.endDate || '-', r.availableFrom || r.tenant?.endDate || 'YA', r.price];
            }
        });
    });
    autoSizeColumns(ws);
};

const addAuditTrailSheets = (workbook: ExcelJS.Workbook, properties: Property[], users: any[]) => {
    const usedNames = new Set<string>();

    properties.forEach(p => {
        // Create a unique identifier: Address + Floor (if exists)
        const baseName = `${p.address}${p.floor ? ` ${p.floor}` : ''}`
            .replace(/[\\/?*[\]:]/g, '')
            .substring(0, 25);

        let sheetName = `H_${baseName}`;
        let counter = 1;

        // Sequence protection: find a non-existing name
        while (usedNames.has(sheetName)) {
            const suffix = ` (${++counter})`;
            sheetName = `H_${baseName}`.substring(0, 31 - suffix.length) + suffix;
        }
        usedNames.add(sheetName);

        const ws = workbook.addWorksheet(sheetName);
        ws.columns = [
            { header: 'Fecha', key: 'd', width: 15 },
            { header: 'Origen', key: 'o', width: 15 },
            { header: 'Tipo', key: 't', width: 15 },
            { header: 'Info', key: 'i', width: 80 }
        ];
        applyHeaderStyle(ws.getRow(1));

        const evts = [
            ...(p.timeline || []).map(e => ({ ...e, o: 'GENERAL' })),
            ...(p.maintenanceTimeline || []).map(e => ({ ...e, o: 'MANTENIMIENTO' })),
            ...(p.rooms || []).flatMap(r => (r.timeline || []).map(e => ({ ...e, o: r.name })))
        ].sort((a, b) => {
            const dateA = (a.date || '').split('/').reverse().join('-');
            const dateB = (b.date || '').split('/').reverse().join('-');
            return dateB.localeCompare(dateA);
        });

        evts.forEach((e, i) => {
            const row = ws.getRow(i + 2);
            row.values = [e.date, e.o, (e.type || 'info').toUpperCase(), e.text];
            if (e.type === 'incident') row.getCell(3).font = { color: { argb: 'FFEF4444' }, bold: true };
            if (e.type === 'contract') row.getCell(3).font = { color: { argb: 'FF2563EB' }, bold: true };
        });

        autoSizeColumns(ws);
    });
};

export const copyToClipboardForSheets = async (properties: Property[]) => {
    // Build Header
    const headers = [
        'Propiedad', 'Habitación', 'Estado',
        'Precio', 'Fianza', 'Comisión %', 'Beneficio Mes',
        'Inquilino', 'Teléfono', 'Email', 'Fin Contrato', 'Notas'
    ];
    let tsvContent = headers.join('\t') + '\n';

    // Build Rows
    properties.forEach(p => {
        (p.rooms || []).forEach(r => {
            // Logic sync with addPropertyRows
            const basePrice = Math.max(0, (r.price || 0) - (p.commissionBaseDeduction || 0));
            const baseComm = r.commissionValue ?? p.managementCommission ?? 10;
            const isPercentage = r.commissionType !== 'fixed';
            let profitAmount = isPercentage ? (basePrice * (baseComm / 100)) : baseComm;
            if (!p.commissionIncludesIVA) profitAmount *= 1.21;

            // Should usually be 0 if not occupied/paying, but for raw data dump sometimes seeing potential is good? 
            // Let's stick to "Real" profit as per Excel report
            if (r.status !== 'occupied' || r.isNonPayment) profitAmount = 0;

            const rowData = [
                p.address,
                r.name,
                r.status === 'occupied' ? 'ALQUILADA' : r.status === 'reserved' ? 'RESERVADA' : 'LIBRE',
                (r.price || 0).toString().replace('.', ','),
                (r.tenant?.deposit || 0).toString().replace('.', ','),
                isPercentage ? `${baseComm}%` : '-',
                profitAmount.toFixed(2).replace('.', ','), // European format for Sheets paste
                r.tenant?.name || '-',
                r.tenant?.phone || '-',
                r.tenant?.email || '-',
                r.tenant?.endDate || '-',
                `[${p.city}] ` + (r.isNonPayment ? 'IMPAGO ' : '') + (r.notes || '')
            ];

            tsvContent += rowData.join('\t') + '\n';
        });
    });

    try {
        await navigator.clipboard.writeText(tsvContent);
        alert('✅ Datos copiados al portapapeles.\n\nAbre Google Sheets y pega (Ctrl+V) para ver los datos formateados.');
    } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Error al copiar al portapapeles. Habilita permisos de portapapeles.');
    }
};

export const downloadCSVForSheets = (properties: Property[]) => {
    // Build Header
    const headers = [
        'Propiedad', 'Habitación', 'Estado',
        'Precio', 'Fianza', 'Comisión %', 'Beneficio Mes',
        'Inquilino', 'Teléfono', 'Email', 'Fin Contrato', 'Notas'
    ];
    let csvContent = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n';

    // Build Rows
    properties.forEach(p => {
        (p.rooms || []).forEach(r => {
            // Logic sync with addPropertyRows
            const basePrice = Math.max(0, (r.price || 0) - (p.commissionBaseDeduction || 0));
            const baseComm = r.commissionValue ?? p.managementCommission ?? 10;
            const isPercentage = r.commissionType !== 'fixed';
            let profitAmount = isPercentage ? (basePrice * (baseComm / 100)) : baseComm;
            if (!p.commissionIncludesIVA) profitAmount *= 1.21;

            if (r.status !== 'occupied' || r.isNonPayment) profitAmount = 0;

            const rowData = [
                p.address,
                r.name,
                r.status === 'occupied' ? 'ALQUILADA' : r.status === 'reserved' ? 'RESERVADA' : 'LIBRE',
                (r.price || 0),
                (r.tenant?.deposit || 0),
                isPercentage ? `${baseComm}%` : '-',
                profitAmount.toFixed(2),
                r.tenant?.name || '-',
                r.tenant?.phone || '-',
                r.tenant?.email || '-',
                r.tenant?.endDate || '-',
                `[${p.city}] ` + (r.isNonPayment ? 'IMPAGO ' : '') + (r.notes || '')
            ];

            // Escape quotes inside fields and wrap in quotes
            const line = rowData.map(v => {
                const safeVal = String(v).replace(/"/g, '""');
                return `"${safeVal}"`;
            }).join(',');

            csvContent += line + '\n';
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Datos_Rentia_ImportarSheets_${new Date().toISOString().split('T')[0]}.csv`);
};

