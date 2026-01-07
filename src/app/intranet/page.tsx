"use client";

import { useAuth } from "@/contexts/AuthContext";
import { OwnerDashboard } from "@/components/dashboards/OwnerDashboard";
import { TenantDashboard } from "@/components/dashboards/TenantDashboard";
import { BrokerDashboardInternal } from "@/components/dashboards/BrokerDashboard";
import { AgencyDashboard } from "@/components/dashboards/AgencyDashboard";
import { StaffDashboard } from "@/components/dashboards/StaffDashboard";
import { WorkerDashboard } from "@/components/dashboards/WorkerDashboard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { GDPRWall } from "@/components/dashboards/GDPRWall";

export default function IntranetPage() {
    const { userRole, currentUser, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), (snapshot) => {
            if (snapshot.exists()) {
                setProfile(snapshot.data());
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAcceptGDPR = async () => {
        if (!currentUser) return;
        try {
            const now = new Date();
            const day = now.getDate();
            const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            const month = monthNames[now.getMonth()];
            const year = now.getFullYear();
            const signingDateFormatted = `${day} de ${month} del ${year}`;
            const signingTime = now.toLocaleTimeString('es-ES');

            // Generamos la evidencia oficial basada en la plantilla de Rentger
            const evidenceHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; padding: 50px; max-width: 800px; margin: auto; border: 1px solid #e0e0e0; background: white;">
                    <div style="text-align: center; border-bottom: 2px solid #0072CE; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="color: #0072CE; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">CONSENTIMIENTO EXPLÍCITO (SERVICIOS)</h1>
                        <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">Rentia Investments S.L. - Gestión Documental RGPD</p>
                    </div>

                    <p style="text-align: right; font-weight: bold; margin-bottom: 40px; color: #444;">Murcia, en fecha ${signingDateFormatted}</p>

                    <div style="font-size: 13px; text-align: justify;">
                        <p><strong>RENTIA INVESTMENTS S.L.</strong> es el Responsable del tratamiento de los datos personales del Interesado y le informa de que estos datos se tratarán de conformidad con lo dispuesto en el Reglamento (UE) 2016/679, de 27 de abril (GDPR), y la Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD), por lo que se le facilita la siguiente información del tratamiento:</p>

                        <p><strong>Fines y legitimación del tratamiento:</strong> prestación de los servicios solicitados (por ser necesario para la ejecución del contrato que supone dichos servicios, art. 6.1.b GDPR) y envío de comunicaciones de productos o servicios (con el consentimiento del interesado, art. 6.1.a GDPR), incluyendo el envío de comunicaciones relacionadas a través de medios electrónicos como <strong>correo electrónico, WhatsApp, SMS o llamadas telefónicas</strong>.</p>

                        <p><strong>Criterios de conservación de los datos:</strong> se conservarán durante no más tiempo del necesario para mantener el fin del tratamiento o mientras existan prescripciones legales que dictaminen su custodia y cuando ya no sea necesario para ello, se suprimirán con medidas de seguridad adecuadas para garantizar la anonimización de los datos o la destrucción total de los mismos.</p>

                        <p><strong>Comunicación de los datos:</strong> no se comunicarán los datos a terceros, salvo obligación legal o que sea necesario para la prestación del servicio.</p>

                        <p style="margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px;"><strong>Derechos que asisten al Interesado:</strong></p>
                        <ul style="margin-top: 10px;">
                            <li>Derecho a retirar el consentimiento en cualquier momento.</li>
                            <li>Derecho de acceso, rectificación, portabilidad y supresión de sus datos y de limitación u oposición a su tratamiento.</li>
                            <li>Derecho a presentar una reclamación ante la Autoridad de control (www.aepd.es) si considera que el tratamiento no se ajusta a la normativa vigente.</li>
                        </ul>

                        <div style="margin-top: 25px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                            <p style="margin: 0;"><strong>Datos de contacto para ejercer sus derechos:</strong></p>
                            <p style="margin: 5px 0 0 0;"><strong>RENTIA INVESTMENTS S.L.</strong><br>
                            C/ Brazal de Álamos, 7, 30130 Beniel, Murcia<br>
                            E-mail: <a href="mailto:info@rentiaroom.com" style="color: #0072CE; text-decoration: none;">info@rentiaroom.com</a></p>
                        </div>

                        <p style="margin-top: 30px; font-weight: bold; color: #0072CE;">El Interesado o su representante legal consiente el tratamiento de sus datos en los términos expuestos:</p>

                        <div style="margin-top: 20px; border: 1px solid #e0e0e0; padding: 25px; border-radius: 12px; background: #fffcf5;">
                            <p style="margin: 0 0 10px 0;"><strong>Nombre:</strong> ${profile?.name || currentUser.displayName || 'Usuario Registrado'}</p>
                            <p style="margin: 0 0 10px 0;"><strong>DNI/NIE/PASAPORTE:</strong> ${profile?.dni || profile?.documentId || 'No proporcionado'}</p>
                        </div>
                    </div>

                    <div style="margin-top: 40px; text-align: center;">
                        <div style="display: block; margin: auto; max-width: 320px; border: 2px solid #0072CE; padding: 15px; border-radius: 10px; background-color: #f0f7ff;">
                            <div style="color: #0072CE; font-weight: bold; font-size: 15px; margin-bottom: 5px; display: block;">FIRMADO DIGITALMENTE</div>
                            <div style="color: #444; font-size: 10px; font-family: monospace; display: block;">UUID: ${currentUser.uid}</div>
                            <div style="color: #888; font-size: 9px; margin-top: 5px; display: block;">Protocolo de Seguridad RentiaRoom v2.5</div>
                        </div>
                        <p style="margin-top: 10px; font-size: 12px; color: #111;">Firma: ________________________ (Digital)</p>
                    </div>

                    <div style="page-break-before: always; border-top: 2px dashed #eee; margin-top: 60px; padding-top: 20px;">
                        <h2 style="color: #0072CE; font-size: 15px; text-transform: uppercase;">ANEXO LEGAL: AVISO LEGAL Y CONDICIONES</h2>
                        <div style="font-size: 10px; color: #555; text-align: justify;">
                            <p><strong>Identificación:</strong> Rentia Investments S.L. (NIF: B-75995308). Registro Mercantil de Murcia. Representante Legal: Pol Matencio Espinosa.</p>
                            <p><strong>Exención Inversiones:</strong> Toda información de rentabilidades son estimaciones de mercado y no garantizan resultados futuros.</p>
                            <p><strong>Propiedad Intelectual:</strong> Todos los contenidos de la plataforma son propiedad exclusiva de la empresa.</p>
                        </div>
                    </div>

                    <div style="margin-top: 40px; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                        Este documento tiene plena validez jurídica como prueba de consentimiento explícito recogido el ${signingDateFormatted}.
                    </div>
                </div>
            `;

            await updateDoc(doc(db, "users", currentUser.uid), {
                gdprAccepted: true,
                gdprDate: serverTimestamp(),
                gdprVersion: "2025-01",
                gdprEvidence: evidenceHtml,
                "gdpr.signed": true,
                "gdpr.signedAt": serverTimestamp(),
                "gdpr.htmlSnapshot": evidenceHtml
            });
        } catch (error) {
            console.error(error);
            alert("Error al guardar el consentimiento.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rentia-blue"></div>
            </div>
        );
    }

    if (currentUser && profile && !profile.gdprAccepted) {
        return <GDPRWall onAccept={handleAcceptGDPR} onLogout={() => logout()} />;
    }

    if (userRole === 'owner') return <OwnerDashboard />;
    if (userRole === 'tenant') return <TenantDashboard />;
    if (userRole === 'broker') return <BrokerDashboardInternal />;
    if (userRole === 'agency') return <AgencyDashboard />;
    if (userRole === 'staff') return <StaffDashboard />;
    if (userRole === 'worker') return <WorkerDashboard />;

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Debes iniciar sesión para acceder a la intranet.</p>
        </div>
    );
}
