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

