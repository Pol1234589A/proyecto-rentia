import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Property, Room } from '../data/rooms';

export interface ExcelOptions {
    includeTenantInfo: boolean;
    includeFinancials: boolean;
    includeOwnerInfo: boolean;
    includeCleaningInfo: boolean; // NEW
    includeTimelines: boolean;
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
        { header: 'Habitación', key: 'room', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
    ];

    if (options.includeFinancials) {
        columns.push(
            { header: 'Precio', key: 'price', width: 12 },
            { header: 'Fianza', key: 'deposit', width: 12 },
            { header: 'Comisión %', key: 'commissionPercent', width: 12 },
            { header: 'Beneficio Mes (€)', key: 'commissionAmount', width: 15 }
        );
    }

    if (options.includeTenantInfo) {
        columns.push(
            { header: 'Inquilino', key: 'tenantName', width: 25 },
            { header: 'Teléfono', key: 'tenantPhone', width: 15 },
            { header: 'Email', key: 'tenantEmail', width: 25 },
            { header: 'Inicio', key: 'startDate', width: 12 },
            { header: 'Fin', key: 'endDate', width: 12 },
            { header: 'Contrato', key: 'contract', width: 15 } // NEW: Hyperlink column
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

    columns.push({ header: 'Notas / Incidencias', key: 'notes', width: 30 });

    return columns;
};

const autoSizeColumns = (worksheet: ExcelJS.Worksheet) => {
    worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
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

const addPropertyRows = (worksheet: ExcelJS.Worksheet, properties: Property[], options: ExcelOptions, userDataMap?: Record<string, any>) => {
    let currentRowIndex = 2; // Start after header

    properties.forEach(property => {
        // Property Header Row
        const propertyRow = worksheet.getRow(currentRowIndex);
        propertyRow.getCell(1).value = `${property.address} (${property.city})`;
        applySubHeaderStyle(propertyRow);
        worksheet.mergeCells(`A${currentRowIndex}:${String.fromCharCode(65 + worksheet.columns.length - 1)}${currentRowIndex}`);
        currentRowIndex++;

        (property.rooms || []).forEach(room => {
            const row = worksheet.getRow(currentRowIndex);

            // Basic Info
            row.getCell('property').value = property.address; // Usually hidden by merge or ignored if hierarchical
            row.getCell('room').value = room.name;

            // Status
            const statusCell = row.getCell('status');
            let statusLabel = 'LIBRE';
            let statusColor = 'FF10B981'; // Emerald 500

            if (room.status === 'occupied') { statusLabel = 'ALQUILADA'; statusColor = 'FF64748B'; } // Slate 500
            if (room.status === 'reserved') { statusLabel = 'RESERVADA'; statusColor = 'FFF59E0B'; } // Amber 500
            if (room.isNonPayment) { statusLabel = 'IMPAGO'; statusColor = 'FFEF4444'; } // Red 500

            statusCell.value = statusLabel;
            statusCell.font = { color: { argb: statusColor }, bold: true };

            // Financials
            if (options.includeFinancials) {
                row.getCell('price').value = room.price;
                row.getCell('deposit').value = room.tenant?.deposit || 0;

                // Calculate abstract commission/profit
                const basePrice = Math.max(0, (room.price || 0) - (property.commissionBaseDeduction || 0));
                const baseComm = room.commissionValue ?? property.managementCommission ?? 10;
                const isPercentage = room.commissionType !== 'fixed';

                let profitAmount = isPercentage ? (basePrice * (baseComm / 100)) : baseComm;
                if (!property.commissionIncludesIVA) profitAmount *= 1.21;

                row.getCell('commissionPercent').value = isPercentage ? `${baseComm}%` : '-';
                // If payment directly to owner, Rentia still profits the commission, so we show it, but maybe we mark it?
                // Actually the profit is the same.
                row.getCell('commissionAmount').value = room.status === 'occupied' && !room.isNonPayment ? profitAmount : 0;
            }

            // Tenant
            if (options.includeTenantInfo) {
                row.getCell('tenantName').value = room.tenant?.name || '-';
                row.getCell('tenantPhone').value = room.tenant?.phone || '-';
                row.getCell('tenantEmail').value = room.tenant?.email || '-';
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

            // Owner (If passed in userDataMap, we'd look up property.ownerId)
            if (options.includeOwnerInfo && userDataMap && property.ownerId) {
                const owner = userDataMap[property.ownerId];
                row.getCell('ownerName').value = owner?.name || 'N/D';
                row.getCell('ownerPhone').value = owner?.phone || 'N/D';
                // Keys info often tied to owner or management. 
                // Since we don't have a structured field yet, we infer from notes or default.
                row.getCell('keysLocation').value = property.internalNotes?.includes('Llaves') ? 'Ver Notas' : 'En Oficina';
            } else if (options.includeOwnerInfo) {
                row.getCell('keysLocation').value = 'En Oficina';
            }

            // Notes
            const notes = [];
            if (property.internalNotes) notes.push(`[Prop] ${property.internalNotes}`);
            if (room.notes) notes.push(`[Hab] ${room.notes}`);
            if (room.isNonPayment) notes.push('IMPAGO REGISTRADO');

            if (options.includeTimelines && room.timeline && room.timeline.length > 0) {
                const historyText = room.timeline
                    .map(t => `(${t.date}) ${t.text}`)
                    .join('; ');
                notes.push(`[Historial] ${historyText}`);
            }

            row.getCell('notes').value = notes.join(' | ');

            // Styling
            row.height = 20;
            row.alignment = { vertical: 'middle' };
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

            summaryRow.getCell(1).value = `Total ${property.address}`;
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

    if (options.groupBy === 'topic') {
        // Topic Mode: Create specific sheets with isolated data

        // 1. General Status Sheet
        const statusOpts = { ...options, includeFinancials: false, includeTenantInfo: false, includeOwnerInfo: false, includeCleaningInfo: false };
        const sheetStatus = workbook.addWorksheet('Estado General');
        sheetStatus.columns = getColumns(statusOpts);
        applyHeaderStyle(sheetStatus.getRow(1));
        addPropertyRows(sheetStatus, properties, statusOpts, userDataMap);
        autoSizeColumns(sheetStatus);

        // 2. Financial Sheet
        const finOpts = { ...options, includeFinancials: true, includeTenantInfo: false, includeOwnerInfo: false, includeCleaningInfo: false };
        const sheetFin = workbook.addWorksheet('Financiero');
        sheetFin.columns = getColumns(finOpts);
        applyHeaderStyle(sheetFin.getRow(1));
        addPropertyRows(sheetFin, properties, finOpts, userDataMap);
        autoSizeColumns(sheetFin);

        // 3. Contacts (Tenants & Owners)
        const contactOpts = { ...options, includeFinancials: false, includeTenantInfo: true, includeOwnerInfo: true, includeCleaningInfo: false };
        const sheetContacts = workbook.addWorksheet('Agenda Contactos');
        sheetContacts.columns = getColumns(contactOpts);
        applyHeaderStyle(sheetContacts.getRow(1));
        addPropertyRows(sheetContacts, properties, contactOpts, userDataMap);
        autoSizeColumns(sheetContacts);

        // 4. Services (Cleaning)
        const serviceOpts = { ...options, includeFinancials: false, includeTenantInfo: false, includeOwnerInfo: false, includeCleaningInfo: true };
        const sheetServices = workbook.addWorksheet('Limpieza y Servicios');
        sheetServices.columns = getColumns(serviceOpts);
        applyHeaderStyle(sheetServices.getRow(1));
        addPropertyRows(sheetServices, properties, serviceOpts, userDataMap);
        autoSizeColumns(sheetServices);

    } else {
        // Standard modes (None, City, Status)
        let sheetsMap: Record<string, Property[]> = {};

        if (options.groupBy === 'none') {
            sheetsMap['Informe General'] = properties;
        } else if (options.groupBy === 'city') {
            properties.forEach(p => {
                const city = p.city || 'Otros';
                if (!sheetsMap[city]) sheetsMap[city] = [];
                sheetsMap[city].push(p);
            });
        }

        // Create sheets based on map
        Object.keys(sheetsMap).forEach(sheetName => {
            const worksheet = workbook.addWorksheet(sheetName);
            worksheet.columns = getColumns(options);
            applyHeaderStyle(worksheet.getRow(1));
            addPropertyRows(worksheet, sheetsMap[sheetName], options, userDataMap);
            autoSizeColumns(worksheet);
        });
    }

    // Additional "Summary" Sheet if financials are included globally or in topic mode (which implies we care about totals)
    if (options.includeFinancials || options.groupBy === 'topic') {
        const summarySheet = workbook.addWorksheet('Resumen de Negocio');
        summarySheet.columns = [
            { header: 'Concepto', key: 'concept', width: 40 },
            { header: 'Total (€)', key: 'total', width: 20 },
        ];
        applyHeaderStyle(summarySheet.getRow(1));

        let totalPotential = 0;
        let totalOccupied = 0;
        let totalProfit = 0;

        properties.forEach(p => {
            (p.rooms || []).forEach(r => {
                if (r.price) totalPotential += r.price;
                if (r.status === 'occupied' && r.price) {
                    totalOccupied += r.price;
                    const basePrice = Math.max(0, (r.price || 0) - (p.commissionBaseDeduction || 0));
                    const baseComm = r.commissionValue ?? p.managementCommission ?? 10;
                    const isPercentage = r.commissionType !== 'fixed';
                    let profitAmount = isPercentage ? (basePrice * (baseComm / 100)) : baseComm;
                    if (!p.commissionIncludesIVA) profitAmount *= 1.21;
                    if (!r.isNonPayment) totalProfit += profitAmount;
                }
            });
        });

        const rows = [
            ['Facturación Potencial Mensual (100% Ocupado)', totalPotential],
            ['Facturación Actual Mensual (Real)', totalOccupied],
            ['Beneficio Estimado Rentia (Mensual)', totalProfit],
            ['Ocupación', `${Math.round((totalOccupied / (totalPotential || 1)) * 100)}%`]
        ];

        rows.forEach((r, idx) => {
            const row = summarySheet.getRow(idx + 2);
            row.getCell(1).value = r[0];
            row.getCell(2).value = typeof r[1] === 'number' ? r[1] : r[1];
            if (typeof r[1] === 'number' && idx !== 3) row.getCell(2).numFmt = '#,##0.00 "€"';

            row.height = 25;
            row.alignment = { vertical: 'middle' };
            if (idx === 2) row.font = { bold: true, color: { argb: 'FF10B981' } }; // Highlight profit
        });

        autoSizeColumns(summarySheet);
    }

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Informe_Rentia_Tematico_${new Date().toISOString().split('T')[0]}.xlsx`);
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

export const generateIncidentsReport = async (properties: Property[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Incidencias y Ayuda');

    worksheet.columns = [
        { header: 'Fecha', key: 'date', width: 15 },
        { header: 'Propiedad', key: 'property', width: 30 },
        { header: 'Habitación', key: 'room', width: 15 },
        { header: 'Inquilino', key: 'tenant', width: 25 },
        { header: 'Tipo', key: 'type', width: 20 },
        { header: 'Descripción del Caso', key: 'description', width: 50 },
        { header: 'Solución / Estado', key: 'status', width: 20 }
    ];

    applyHeaderStyle(worksheet.getRow(1));

    let rowIndex = 2;
    properties.forEach(p => {
        (p.rooms || []).forEach(r => {
            (r.timeline || []).forEach(t => {
                // Filter specifically for incidents or maintenance which usually track problems
                if (t.type === 'incident' || t.type === 'maintenance') {
                    const row = worksheet.getRow(rowIndex);
                    row.getCell('date').value = t.date;
                    row.getCell('property').value = p.address;
                    row.getCell('room').value = r.name;
                    row.getCell('tenant').value = r.tenant?.name || '-';

                    const isIncident = t.type === 'incident';
                    row.getCell('type').value = isIncident ? 'INCIDENCIA' : 'MANTENIMIENTO';
                    row.getCell('type').font = {
                        color: { argb: isIncident ? 'FFFFFFFF' : 'FF1E293B' }, // White on Red or Slate
                        bold: true
                    };
                    row.getCell('type').fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: isIncident ? 'FFEF4444' : 'FFE2E8F0' } // Red or Slate 200
                    };
                    row.getCell('type').alignment = { vertical: 'middle', horizontal: 'center' };

                    row.getCell('description').value = t.text;

                    // Simple logic to detect "Status" from text keywords if not explicitly tracked
                    const textLower = t.text.toLowerCase();
                    let status = 'ABIERTO';
                    if (textLower.includes('resuelto') || textLower.includes('solucionado') || textLower.includes('cerrado') || textLower.includes('finalizado')) {
                        status = 'RESUELTO';
                    } else if (textLower.includes('en proceso') || textLower.includes('pendiente')) {
                        status = 'EN PROCESO';
                    }

                    row.getCell('status').value = status;
                    if (status === 'RESUELTO') row.getCell('status').font = { color: { argb: 'FF10B981' }, bold: true };

                    row.height = 25;
                    row.alignment = { vertical: 'middle' };
                    // Borders
                    row.eachCell((cell) => {
                        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
                    });

                    rowIndex++;
                }
            });
        });
    });

    autoSizeColumns(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Incidencias_Rentia_${new Date().toISOString().split('T')[0]}.xlsx`);
};
