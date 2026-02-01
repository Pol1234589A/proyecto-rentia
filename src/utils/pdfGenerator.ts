import { Property } from '../data/rooms';

export interface PDFOptions {
    mode: 'internal' | 'commercial';
    showOnlyAvailable?: boolean;
}

export const generatePropertySummaryPDF = async (properties: Property[], options: PDFOptions = { mode: 'internal' }) => {
    if (typeof window === 'undefined') return;
    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.createElement('div');
    element.className = 'pdf-container';

    const isCommercial = options.mode === 'commercial';

    // Rentia Branding & Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .pdf-container {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 40px;
            color: #1e293b;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #0072CE;
            padding-bottom: 25px;
            margin-bottom: 35px;
        }
        .logo {
            font-size: 32px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -1.5px;
        }
        .logo span {
            color: #0072CE;
        }
        .report-title {
            text-align: right;
        }
        .report-title h1 {
            margin: 0;
            font-size: 24px;
            color: #0072CE;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 900;
        }
        .report-title p {
            margin: 5px 0 0;
            font-size: 11px;
            color: #64748b;
            font-weight: bold;
        }
        .property-section {
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
        .property-header {
            background: #f8fafc;
            border-left: 5px solid #0072CE;
            padding: 15px 25px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 0 12px 12px 0;
        }
        .property-address {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
        }
        .property-meta {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
        }
        th {
            background: #f1f5f9;
            text-align: left;
            padding: 15px 20px;
            color: #475569;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.5px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 15px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-weight: 600;
        }
        .val-pill {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 900;
            display: inline-block;
        }
        .val-price { background: #eff6ff; color: #1e40af; }
        .val-percent { background: #fdf2f7; color: #9d174d; }
        .val-profit { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
        .val-alert { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        
        .feature-tag {
            display: inline-flex;
            align-items: center;
            background: #f1f5f9;
            color: #475569;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 9px;
            margin-right: 4px;
            margin-bottom: 4px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .legal-notice {
            margin-top: 40px;
            padding: 20px;
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 12px;
            page-break-inside: avoid;
        }
        .legal-notice h5 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .legal-notice p {
            margin: 0;
            color: #b45309;
            font-size: 10px;
            line-height: 1.5;
            font-weight: 600;
        }

        .global-summary {
            margin-top: 60px;
            padding: 30px;
            background: #0f172a;
            color: white;
            border-radius: 24px;
            display: flex;
            justify-content: space-around;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .summary-box h4 { margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
        .summary-box p { margin: 10px 0 0; font-size: 28px; font-weight: 900; }
        .summary-box .highlight { color: #38bdf8; }
        
        .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            font-weight: bold;
        }
    `;
    element.appendChild(style);

    // Header Content
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
        <div class="logo">RENTIA<span>ROOM</span></div>
        <div class="report-title">
            <h1>${isCommercial ? 'Dossier Comercial' : 'Reporte de Gestión'}</h1>
            <p>Estado de Activos al ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
    `;
    element.appendChild(header);

    let totalGlobalProfit = 0;
    let totalRooms = 0;
    let occupiedRooms = 0;

    properties.forEach(prop => {
        let rooms = prop.rooms || [];
        if (options.showOnlyAvailable) {
            rooms = rooms.filter(r => r.status === 'available');
        }

        if (rooms.length === 0) return;

        const propSection = document.createElement('div');
        propSection.className = 'property-section';

        const propOccupied = rooms.filter(r => r.status === 'occupied').length;

        const calculateRoomProfit = (room: any) => {
            // Un pago reportado como impago NO genera beneficio/comisión para Rentia ese mes
            if (room.isNonPayment) return 0;

            const baseComm = room.commissionValue ?? prop.managementCommission ?? 10;
            const isPercentage = room.commissionType !== 'fixed';
            let amount = isPercentage ? ((room.price || 0) * (baseComm / 100)) : baseComm;

            // Si la comisión no incluye IVA, se lo sumamos al beneficio de Rentia
            if (!prop.commissionIncludesIVA) {
                amount = amount * 1.21;
            }
            return Math.round(amount);
        };

        const propProfit = rooms.reduce((acc, r) => acc + (r.status === 'occupied' ? calculateRoomProfit(r) : 0), 0);

        totalGlobalProfit += propProfit;
        totalRooms += rooms.length;
        occupiedRooms += propOccupied;

        // Limpiar dirección si es comercial (quitar planta/letra)
        const displayAddress = isCommercial
            ? prop.address?.split(',').slice(0, 2).join(',')
            : prop.address;

        propSection.innerHTML = `
            <div class="property-header">
                <div class="property-address">${displayAddress}</div>
                <div class="property-meta">${rooms.length} HABITACIONES ${!isCommercial ? `• ${propOccupied} ALQUILADAS` : ''}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th width="${isCommercial ? '30%' : '40%'}">Habitación</th>
                        ${isCommercial ? '<th width="40%">Equipamiento</th>' : ''}
                        <th width="${isCommercial ? '30%' : '30%'}">PVP Mensual <span style="font-size: 8px; opacity: 0.6;">(IVA INC.)</span></th>
                        ${!isCommercial ? `
                            <th width="15%">Comisión</th>
                            <th width="15%">Bº Neto <span style="font-size: 8px; opacity: 0.6;">(IVA INC.)</span></th>
                        ` : ''}
                    </tr>
                </thead>
                <tbody>
                    ${rooms.map(r => {
            const profit = calculateRoomProfit(r);
            const baseComm = r.commissionValue ?? prop.managementCommission ?? 10;
            const isPercentage = r.commissionType !== 'fixed';
            const commissionLabel = isPercentage ? `${baseComm}% + IVA` : `${baseComm}€`;

            // Características para modo comercial
            const features: string[] = [];
            if (r.hasAirConditioning) features.push('A/C');
            if (r.bedType === 'double') features.push('Cama Doble');
            if (r.hasHeating) features.push('Calefacción');
            if (r.features?.includes('desk')) features.push('Escritorio');
            if (r.features?.includes('lock')) features.push('Cerradura');
            if (r.features?.includes('smart_tv')) features.push('Smart TV');
            if (r.features?.includes('private_bath')) features.push('Baño Privado');
            if (r.features?.includes('wifi')) features.push('WiFi');
            if (r.features?.includes('exterior')) features.push('Exterior');

            return `
                            <tr>
                                <td style="color: #0f172a; font-size: 14px;">
                                    ${r.name?.replace(/Habitación\s*/i, 'H')}
                                    ${!isCommercial && r.isNonPayment ? '<span class="val-pill val-alert" style="margin-left: 10px; font-size: 8px;">IMPAGO</span>' : ''}
                                </td>
                                ${isCommercial ? `
                                    <td>
                                        <div style="display: flex; flex-wrap: wrap;">
                                            ${features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                                            ${features.length === 0 ? '<span style="color: #94a3b8; font-style: italic; font-size: 10px;">Equipamiento estándar</span>' : ''}
                                        </div>
                                    </td>
                                ` : ''}
                                <td><span class="val-pill val-price">${r.price}€</span></td>
                                ${!isCommercial ? `
                                    <td><span class="val-pill val-percent">${commissionLabel}</span></td>
                                    <td><span class="val-pill val-profit">+ ${profit}€</span></td>
                                ` : ''}
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;
        element.appendChild(propSection);
    });

    if (isCommercial) {
        const legalNotice = document.createElement('div');
        legalNotice.className = 'legal-notice';
        legalNotice.innerHTML = `
            <h5>Aviso Legal e Información Importante</h5>
            <p>
                El precio marcado en este dossier puede cambiar y el interesado debe de asegurarse del precio final antes de contratar los servicios. 
                Pueden existir comisiones asociadas a las habitaciones que deberán preguntarse también en el momento de la firma del contrato solicitando las condiciones claras y actualizadas.
                Este documento es meramente informativo y no constituye una oferta contractual vinculante.
            </p>
        `;
        element.appendChild(legalNotice);
    }

    if (!isCommercial) {
        // Global Summary
        const summary = document.createElement('div');
        summary.className = 'global-summary';
        summary.innerHTML = `
            <div class="summary-box">
                <h4>Total Activos</h4>
                <p>${properties.length}</p>
            </div>
            <div class="summary-box">
                <h4>Ocupación Media</h4>
                <p class="highlight">${totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%</p>
            </div>
            <div class="summary-box">
                <h4>Beneficio Bruto Mensual</h4>
                <p style="color: #10b981;">${Math.round(totalGlobalProfit).toLocaleString('es-ES')}€</p>
            </div>
        `;
        element.appendChild(summary);
    }

    const footer = document.createElement('div');
    footer.className = 'footer';
    footer.innerHTML = isCommercial
        ? 'Dossier de disponibilidad generado por RentiaRoom. Calidad y transparencia en gestión de activos.'
        : `Reporte confidencial generado por el Sistema Interna de RentiaRoom. &copy; ${new Date().getFullYear()} Todos los derechos reservados.`;
    element.appendChild(footer);

    const opt = {
        margin: 15,
        filename: `${isCommercial ? 'Rentia_Dossier_Comercial' : 'Rentia_Reporte_Rentabilidad'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
};

export const generateCompanyConditionsPDF = async (config: any) => {
    if (typeof window === 'undefined') return;
    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.createElement('div');
    element.className = 'pdf-container';

    const isMarketing = config.type === 'marketing';
    const isOwners = config.type === 'owners';

    // Rentia Branding & Styles
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
        
        .pdf-container {
            font-family: 'Outfit', 'Segoe UI', sans-serif;
            padding: 40px 50px;
            color: #1e293b;
            background: white;
            line-height: 1.5;
        }

        /* Cover Page */
        .cover {
            height: 940px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
            color: white;
            margin: -40px -50px;
            margin-bottom: 40px;
            padding: 60px;
            page-break-after: always;
        }
        .cover .logo { font-size: 58px; margin-bottom: 20px; font-weight: 900; letter-spacing: -2px; }
        .cover h1 { font-size: 42px; font-weight: 900; margin-bottom: 10px; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; }
        .cover p { font-size: 18px; opacity: 0.9; font-weight: 600; max-width: 550px; }
        .cover .motto { margin-top: 100px; font-size: 11px; letter-spacing: 5px; color: #94a3b8; font-weight: 800; text-transform: uppercase; }

        .header {
            border-bottom: 2px solid #0072CE;
            padding-bottom: 15px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -1.2px;
        }
        .logo span { color: #0072CE; }
        .doc-title { text-align: right; }
        .doc-title h1 { margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; font-weight: 900; }
        .doc-title p { margin: 2px 0 0; font-size: 10px; color: #0072CE; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
        
        .intro {
            margin-bottom: 30px;
            font-size: 13px;
            color: #334155;
            padding: 24px;
            background: #f8fafc;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            line-height: 1.6;
            position: relative;
        }
        .intro::before {
            content: '';
            position: absolute;
            left: 0;
            top: 20%;
            height: 60%;
            width: 4px;
            background: #0072CE;
            border-radius: 0 4px 4px 0;
        }

        .section {
            margin-bottom: 25px;
        }
        .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f1f5f9;
        }
        .section-content {
            font-size: 11px;
            color: #475569;
            white-space: pre-wrap;
            padding-left: 0;
            line-height: 1.6;
        }

        /* Grid for Marketing/Owners */
        .data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 15px;
        }
        .data-card {
            padding: 16px;
            border-radius: 12px;
            page-break-inside: avoid;
        }
        .card-mkt { background: #fff1f2; border: 1px solid #fecdd3; }
        .card-own { background: #f8fafc; border: 1px solid #e2e8f0; border-top: 4px solid #0072CE; }
        
        .data-card h4 { margin: 0 0 6px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        .card-mkt h4 { color: #be123c; }
        .card-own h4 { color: #0f172a; }
        
        .data-card p { margin: 0; font-size: 10px; font-weight: 500; line-height: 1.4; }
        .card-mkt p { color: #9f1239; }
        .card-own p { color: #475569; }

        .referral-box {
            padding: 24px;
            border-radius: 20px;
            margin-top: 30px;
            text-align: center;
            page-break-inside: avoid;
        }
        .ref-mkt { background: #f0fdf4; border: 2px dashed #4ade80; }
        .ref-own { background: #f5f3ff; border: 2px dashed #8b5cf6; }
        
        .referral-box h3 { margin: 0 0 8px 0; font-size: 16px; font-weight: 900; color: #1e293b; }
        .referral-box p { margin: 0; font-size: 12px; font-weight: 600; color: #475569; max-width: 90%; margin: 0 auto; }

        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .highlight-blue { color: #0072CE; font-weight: 900; }

    `;
    element.appendChild(style);

    // Cover (Optional)
    if (config.showCover) {
        const cover = document.createElement('div');
        cover.className = 'cover';
        cover.innerHTML = `
            <div class="logo" style="color: white;">RENTIA<span style="color: #38bdf8;">ROOM</span></div>
            <h1>${config.title}</h1>
            <p>${config.subtitle}</p>
            <div class="motto">${isOwners ? 'GESTIÓN PATRIMONIAL PROFESIONAL' : 'TRANSFORMANDO EL ALQUILER HABITACIONAL'}</div>
        `;
        element.appendChild(cover);
    }

    // Standard Header (if not on cover or for subpages)
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
        <div class="logo">RENTIA<span>ROOM</span></div>
        <div class="doc-title">
            <h1>${config.title}</h1>
            <p>${config.subtitle || (isOwners ? 'Propuesta Propietarios' : 'Dossier Marketing')}</p>
        </div>
    `;
    element.appendChild(header);

    // Intro
    if (config.introText) {
        const intro = document.createElement('div');
        intro.className = 'intro';
        intro.innerText = config.introText;
        element.appendChild(intro);
    }

    // Sections
    config.sections.forEach((section: any) => {
        if (!section.title && !section.content) return;

        const secDiv = document.createElement('div');
        secDiv.className = 'section';
        secDiv.innerHTML = `
            <div class="section-title">${section.title}</div>
            <div class="section-content">${section.content}</div>
        `;
        element.appendChild(secDiv);
    });

    // Special Section: Process Roadmap (for owners or detailed mkt)
    if (config.roadmap?.length > 0) {
        const roadmapSection = document.createElement('div');
        roadmapSection.className = 'section';

        let stepsHtml = '';
        config.roadmap.forEach((step: any, i: number) => {
            stepsHtml += `
                <div style="display: flex; gap: 20px; margin-bottom: 25px; position: relative; align-items: flex-start;">
                    <div style="flex-shrink: 0; width: 32px; height: 32px; background: #0072CE; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; z-index: 2; line-height: 1;">${i + 1}</div>
                    ${i < config.roadmap.length - 1 ? '<div style="position: absolute; left: 15px; top: 32px; bottom: -25px; width: 2px; background: #e2e8f0; z-index: 1;"></div>' : ''}
                    <div style="padding-top: 4px;">
                        <div style="font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 2px;">${step.title}</div>
                        <div style="font-size: 10px; color: #64748b; font-weight: 500; line-height: 1.4;">${step.description}</div>
                    </div>
                </div>
            `;
        });

        roadmapSection.innerHTML = `
            <div class="section-title">NUESTRO PROCESO PASO A PASO</div>
            <div style="background: #f8fafc; padding: 35px 40px; border-radius: 20px; border: 1px solid #e2e8f0; margin-top: 15px;">
                ${stepsHtml}
            </div>
        `;
        element.appendChild(roadmapSection);
    }

    // Special Section: Investor Tables (New)
    if (isOwners && config.investorTables) {
        const tableSection = document.createElement('div');
        tableSection.className = 'section';
        tableSection.innerHTML = `
            <div class="section-title">TABLAS DE DESCUENTOS PARA INVERSORES</div>
            <div style="margin-top: 20px;">
                <div style="background: #0072CE; color: white; padding: 10px; text-align: center; font-size: 11px; font-weight: 900; text-transform: uppercase;">DESCUENTO POR VIVIENDAS PROPIAS</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: 700; width: 50%; border: 1px solid #000;">1 VIVIENDA</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #000;">15% + IVA</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: 700; border: 1px solid #000;">2 VIVIENDAS</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #000;">14% + IVA</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: 700; border: 1px solid #000;">3-5 VIVIENDAS</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #000;">13% + IVA</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: 700; border: 1px solid #000;">6-10 VIVIENDAS</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #000;">12% + IVA</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: 700; border: 1px solid #000;">+ 10 VIVIENDAS</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #000;">10% + IVA</td>
                    </tr>
                </table>

                <div style="background: #0072CE; color: white; padding: 10px; text-align: center; font-size: 11px; font-weight: 900; text-transform: uppercase;">DESCUENTO POR REFERIDOS</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 10px; font-weight: 700; width: 50%; border: 1px solid #000;">POR INVERSOR REFERIDO</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #000;">0,5% + IVA</td>
                    </tr>
                </table>

                <div style="font-size: 9px; color: #334155; text-align: center; padding: 0 40px; font-weight: 500; line-height: 1.4;">
                    Los descuentos se aplican al total de viviendas en <b>gestión activa</b>. Las bonificaciones por volumen y por referidos son acumulables, con un límite conjunto del <b>10% + IVA</b> sobre la comisión de gestión.
                </div>
            </div>
        `;
        element.appendChild(tableSection);
    }

    // Special Section: Data Grid (Promo for tenants, ROI for owners)
    if ((isMarketing || isOwners) && config.discounts?.length > 0) {
        const promoSection = document.createElement('div');
        promoSection.className = 'section';
        promoSection.innerHTML = `
            <div class="section-title">${isOwners ? 'NUESTROS COMPROMISOS' : 'PROMOCIONES POR PISO'}</div>
            <div class="data-grid">
                ${config.discounts.map((d: any) => `
                    <div class="data-card ${isOwners ? 'card-own' : 'card-mkt'}">
                        <h4>${d.apartment}</h4>
                        <p>${d.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
        element.appendChild(promoSection);
    }

    // Referral Info
    if (config.referralInfo) {
        const referral = document.createElement('div');
        referral.className = `referral-box ${isOwners ? 'ref-own' : 'ref-mkt'}`;
        referral.innerHTML = `
            <h3>${isOwners ? 'PLAN AMIGO PROPIETARIO' : 'PROGRAMA DE REFERIDOS'}</h3>
            <p>${config.referralInfo}</p>
        `;
        element.appendChild(referral);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'footer';
    footer.innerText = `${config.footerText || 'RentiaRoom - Gestión Integral'} • Generado el ${new Date().toLocaleDateString('es-ES')}`;
    element.appendChild(footer);

    const filename = isOwners ? 'Rentia_Propuesta_Propietarios' : isMarketing ? 'Rentia_Dossier_Marketing' : 'Rentia_Condiciones';

    const opt = {
        margin: 15,
        filename: `${filename}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
};
