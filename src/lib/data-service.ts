import { pb } from './pb';
import type { CampaignReport } from '../types/db';

interface DateFilter {
  year: string;
  month: number;
}

// --- 1. DATOS GLOBALES (Dashboard Home) ---

export async function getGlobalStats({ year, month }: DateFilter) {
  try {
    const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
      filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Marca"`
    });

    let totalSpend = 0;
    let totalLeads = 0;

    records.forEach(r => {
      totalSpend += r.cost_total_mes || 0;
      totalLeads += r.leads_total_mes || 0;
    });

    return {
      totalSpend,
      totalLeads,
      avgCPL: totalLeads > 0 ? totalSpend / totalLeads : 0,
      activeBrands: records.length,
      error: null
    };
  } catch (error) {
    console.error('[DataService] Error en getGlobalStats:', error);
    return { totalSpend: 0, totalLeads: 0, avgCPL: 0, activeBrands: 0, error: String(error) };
  }
}

export async function getBrandsRanking({ year, month }: DateFilter) {
  try {
    return await pb.collection('campaign_reports').getFullList<CampaignReport>({
      filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Marca"`,
      sort: '-cost_total_mes'
    });
  } catch (error) {
    console.error('[DataService] Error en getBrandsRanking:', error);
    return [];
  }
}

// --- 1b. TODAS LAS CAMPAÑAS (Sidebar derecho) ---

export async function getAllCampaigns({ year, month }: DateFilter) {
  try {
    return await pb.collection('campaign_reports').getFullList<CampaignReport>({
      filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Campaña"`,
      sort: '-cost_total_mes'
    });
  } catch (error) {
    console.error('[DataService] Error en getAllCampaigns:', error);
    return [];
  }
}

// --- 1c. DATOS ANUALES GLOBALES ---

export async function getGlobalYearStats({ year }: { year: string }) {
  try {
    const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
      filter: `year = "${year}" && tipo_registro = "Marca"`
    });

    let totalSpend = 0;
    let totalLeads = 0;
    records.forEach(r => {
      totalSpend += r.cost_total_mes || 0;
      totalLeads += r.leads_total_mes || 0;
    });

    // Group by month
    const monthMap = new Map<number, { spend: number; leads: number }>();
    records.forEach(r => {
      const m = r.month_num;
      const prev = monthMap.get(m) || { spend: 0, leads: 0 };
      monthMap.set(m, {
        spend: prev.spend + (r.cost_total_mes || 0),
        leads: prev.leads + (r.leads_total_mes || 0),
      });
    });

    const months = Array.from(monthMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([month_num, data]) => ({ month_num, ...data }));

    return {
      totalSpend,
      totalLeads,
      avgCPL: totalLeads > 0 ? totalSpend / totalLeads : 0,
      activeBrands: new Set(records.map(r => r.brand || r.nombre_cuenta)).size,
      months,
      error: null,
    };
  } catch (error) {
    console.error('[DataService] Error en getGlobalYearStats:', error);
    return { totalSpend: 0, totalLeads: 0, avgCPL: 0, activeBrands: 0, months: [], error: String(error) };
  }
}

// --- 2. DATOS DE MARCA (Dashboard Detalle) ---

export async function getBrandFullData(brandSlug: string, { year, month }: DateFilter) {
  try {
    const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `(brand ~ "${brandSlug}" || nombre_cuenta ~ "${brandSlug}") && year = "${year}" && month_num = ${month}`,
        sort: '-cost_total_mes'
    });

    const brandReport = records.find(r => r.tipo_registro === 'Marca');
    const campaigns = records.filter(r => r.tipo_registro === 'Campaña');

    return { brandReport, campaigns };
  } catch (error) {
    console.error('[DataService] Error en getBrandFullData:', error);
    return { brandReport: undefined, campaigns: [] };
  }
}

// --- 3. DATOS ANUALES DE MARCA ---

export async function getBrandYearData(brandSlug: string, { year }: { year: string }) {
  try {
    const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
      filter: `(brand ~ "${brandSlug}" || nombre_cuenta ~ "${brandSlug}") && year = "${year}"`,
      sort: 'month_num'
    });

    const brandRecords = records.filter(r => r.tipo_registro === 'Marca');
    const campaignRecords = records.filter(r => r.tipo_registro === 'Campaña');

    let totalSpend = 0;
    let totalLeads = 0;
    brandRecords.forEach(r => {
      totalSpend += r.cost_total_mes || 0;
      totalLeads += r.leads_total_mes || 0;
    });

    return {
      totalSpend,
      totalLeads,
      avgCPL: totalLeads > 0 ? totalSpend / totalLeads : 0,
      monthlyReports: brandRecords,
      campaigns: campaignRecords,
      error: null,
    };
  } catch (error) {
    console.error('[DataService] Error en getBrandYearData:', error);
    return { totalSpend: 0, totalLeads: 0, avgCPL: 0, monthlyReports: [], campaigns: [], error: String(error) };
  }
}
