
import { Opportunity } from '../types';
import { Property } from '../data/rooms';

// Constantes Globales de Negocio
export const CONSTANTS = {
    AGENCY_FEE_MIN: 3000,
    AGENCY_FEE_PERCENT: 0.03, // 3%
    VAT_RATE: 0.21, // 21% IVA
    ITP_DEFAULT: 0.08, // 8% Murcia General
    NOTARY_ESTIMATED: 1500,
    MANAGEMENT_FEE_ROOMS: 0.15, // 15% Gestión Habitaciones
    MANAGEMENT_FEE_TRADITIONAL: 0.10, // 10% Gestión Tradicional
};

export interface FinancialAnalysis {
    purchasePrice: number;
    itpAmount: number;
    agencyFees: number;
    agencyFeesVat: number;
    agencyFeesTotal: number;
    notaryAndTaxes: number;
    reformTotal: number;
    totalInvestment: number;
    
    monthlyIncome: number;
    yearlyIncome: number;
    yearlyExpenses: number;
    
    netYearlyIncome: number;
    netMonthlyCashflow: number;
    
    grossYield: number;
    netYield: number;
    
    isCashflowPositive: boolean;
    isHighYield: boolean; // > 8%
}

/**
 * Calcula todas las métricas financieras de una oportunidad
 */
export const calculateOpportunityFinancials = (opp: Opportunity): FinancialAnalysis => {
    // PROTECCIÓN CONTRA DATOS CORRUPTOS (CRASH FIX)
    if (!opp || !opp.financials) {
        return {
            purchasePrice: 0, itpAmount: 0, agencyFees: 0, agencyFeesVat: 0, agencyFeesTotal: 0,
            notaryAndTaxes: 0, reformTotal: 0, totalInvestment: 0, monthlyIncome: 0,
            yearlyIncome: 0, yearlyExpenses: 0, netYearlyIncome: 0, netMonthlyCashflow: 0,
            grossYield: 0, netYield: 0, isCashflowPositive: false, isHighYield: false
        };
    }

    const { financials, specs, scenario } = opp;
    
    // 1. Costes de Entrada
    const purchasePrice = financials.purchasePrice || 0;
    const itpPercent = financials.itpPercent || CONSTANTS.ITP_DEFAULT;
    const itpAmount = purchasePrice * (itpPercent / 100);
    
    // Honorarios Agencia
    let agencyFees = financials.agencyFees;
    if (agencyFees === undefined) {
        agencyFees = purchasePrice > 100000 
            ? purchasePrice * CONSTANTS.AGENCY_FEE_PERCENT 
            : CONSTANTS.AGENCY_FEE_MIN;
    }
    const agencyFeesVat = agencyFees * CONSTANTS.VAT_RATE;
    const agencyFeesTotal = agencyFees + agencyFeesVat;

    // LÓGICA CORREGIDA: Notaría e Impuestos
    // Si el valor en DB es menor que el ITP calculado, significa que en la DB solo se guardó la provisión de notaría
    // y no el total (Notaría + ITP). En ese caso, sumamos el ITP para normalizar el dato 'notaryAndTaxes' como el TOTAL.
    let notaryAndTaxes = financials.notaryAndTaxes || (CONSTANTS.NOTARY_ESTIMATED + itpAmount);
    
    if (notaryAndTaxes < itpAmount) {
        // Corrección automática para datos antiguos que solo tenían el coste de notaría (ej: 2500)
        notaryAndTaxes += itpAmount;
    }

    const reformTotal = (financials.reformCost || 0) + (financials.furnitureCost || 0);

    // Recalcular Total Inversión con la lógica corregida
    // Nota: Si 'financials.totalInvestment' viene hardcodeado de la DB y estaba mal calculado, 
    // aquí lo estamos sobrescribiendo con la suma correcta de los componentes.
    const totalInvestment = purchasePrice + notaryAndTaxes + reformTotal + agencyFeesTotal;

    // 2. Ingresos y Gastos Operativos
    // Detectar estrategia (si hay proyección de habitaciones > 0, asumimos esa estrategia)
    const isRooms = (financials.monthlyRentProjected || 0) > 0;
    const monthlyIncome = isRooms ? (financials.monthlyRentProjected || 0) : (financials.monthlyRentTraditional || 0);
    const yearlyIncome = monthlyIncome * 12;
    
    // Gastos anuales (IBI, Comunidad, Seguros)
    const yearlyExpenses = financials.yearlyExpenses || 0;
    
    // Estimación de gestión (para cálculo neto real)
    const managementRate = isRooms ? CONSTANTS.MANAGEMENT_FEE_ROOMS : CONSTANTS.MANAGEMENT_FEE_TRADITIONAL;
    const yearlyManagementCost = yearlyIncome * managementRate * (1 + CONSTANTS.VAT_RATE);

    const netYearlyIncome = yearlyIncome - yearlyExpenses - yearlyManagementCost;
    const netMonthlyCashflow = netYearlyIncome / 12;

    // 3. Rentabilidades
    const grossYield = totalInvestment > 0 ? (yearlyIncome / totalInvestment) * 100 : 0;
    const netYield = totalInvestment > 0 ? (netYearlyIncome / totalInvestment) * 100 : 0;

    return {
        purchasePrice,
        itpAmount,
        agencyFees,
        agencyFeesVat,
        agencyFeesTotal,
        notaryAndTaxes, // Este valor ahora SIEMPRE incluye Notaría + ITP
        reformTotal,
        totalInvestment,
        monthlyIncome,
        yearlyIncome,
        yearlyExpenses,
        netYearlyIncome,
        netMonthlyCashflow,
        grossYield,
        netYield,
        isCashflowPositive: netMonthlyCashflow > 0,
        isHighYield: grossYield > 8
    };
};

/**
 * Calcula el Cashflow REAL de una propiedad en cartera basado en datos históricos
 */
export const calculateRealOwnerCashflow = (
    invoices: any[], 
    contracts: any[], 
    managementFeePercent: number
) => {
    // Implementación para el Dashboard de Propietario
    const activeContractsRevenue = contracts
        .filter(c => c.status === 'active')
        .reduce((acc, c) => acc + (Number(c.rentAmount) || 0), 0);
        
    const monthlyExpensesAvg = invoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0) / (invoices.length || 1); // Simplificación media
    
    const fee = activeContractsRevenue * (managementFeePercent / 100) * 1.21;
    
    return {
        revenue: activeContractsRevenue,
        expenses: monthlyExpensesAvg,
        fee: fee,
        net: activeContractsRevenue - monthlyExpensesAvg - fee
    };
};
