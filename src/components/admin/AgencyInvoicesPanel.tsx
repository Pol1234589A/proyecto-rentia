
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Printer, Upload, Download, Eye, Loader2, Search, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { AgencyInvoice } from '../../types';

export const AgencyInvoicesPanel: React.FC = () => {
    const [invoices, setInvoices] = useState<AgencyInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'agency_invoices'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invs: AgencyInvoice[] = [];
            snapshot.forEach((doc) => {
                invs.push({ ...doc.data(), id: doc.id } as AgencyInvoice);
            });
            setInvoices([]); // Forzado vacío por petición hasta tener datos reales
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, invoiceId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(invoiceId);
        try {
            const storageRef = ref(storage, `agency_invoices/${invoiceId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await updateDoc(doc(db, "agency_invoices", invoiceId), {
                fileUrl: downloadURL,
                fileName: file.name,
                status: 'paid' // Opcional: marcar como pagada si se sube el PDF
            });
            alert("PDF subido correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al subir el PDF");
        } finally {
            setUploadingId(null);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Printer className="w-6 h-6 text-rentia-blue" />
                        Gestión de Liquidaciones (Facturas Rentia)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Sube los PDFs de las liquidaciones mensuales para los propietarios.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por propietario o nº..."
                        className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-rentia-blue outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b">
                        <tr>
                            <th className="px-6 py-4">Fecha / Mes</th>
                            <th className="px-6 py-4">Nº Factura</th>
                            <th className="px-6 py-4">Propietario / Propiedad</th>
                            <th className="px-6 py-4 text-right">Total Neto</th>
                            <th className="px-6 py-4 text-center">Estado PDF</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-rentia-blue" /></td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400">No se han encontrado liquidaciones.</td></tr>
                        ) : (
                            filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{new Date(inv.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-blue-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {inv.details?.month || 'S/M'}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-gray-600">{inv.invoiceNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{inv.ownerName}</div>
                                        <div className="text-xs text-gray-500">{inv.propertyAddress}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-lg font-black text-rentia-black">{(inv.totalAmount || 0).toFixed(2)}€</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {inv.fileUrl ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                <CheckCircle className="w-3 h-3" /> PDF Subido
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                <AlertCircle className="w-3 h-3" /> Pendiente PDF
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {inv.fileUrl && (
                                                <button
                                                    onClick={() => window.open(inv.fileUrl, '_blank')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver PDF"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            )}
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => handleFileUpload(e, inv.id)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    disabled={uploadingId === inv.id}
                                                />
                                                <button
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all ${uploadingId === inv.id ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:border-rentia-blue hover:text-rentia-blue'}`}
                                                >
                                                    {uploadingId === inv.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="w-4 h-4" />
                                                    )}
                                                    {inv.fileUrl ? 'Reemplazar' : 'Subir PDF'}
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
