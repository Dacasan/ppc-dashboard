import { pb } from './pb';
import type { CampaignReport } from '../types/db';

interface DateFilter {
  year: string;
  month: number;
}

// --- 1. DATOS GLOBALES (Dashboard Home) ---

export async function getGlobalStats({ year, month }: DateFilter) {
  // Traemos solo los registros consolidados de MARCA
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
    activeBrands: records.length
  };
}

export async function getBrandsRanking({ year, month }: DateFilter) {
  // Ranking de marcas ordenado por Gasto
  return await pb.collection('campaign_reports').getFullList<CampaignReport>({
    filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Marca"`,
    sort: '-cost_total_mes'
  });
}

// --- 2. DATOS DE MARCA (Dashboard Detalle) ---

export async function getBrandFullData(brandSlug: string, { year, month }: DateFilter) {
    // A) Primero buscamos el nombre real de la marca usando el slug (esto podría optimizarse luego)
    // Por ahora asumimos que el slug viene limpio, pero idealmente haríamos un lookup en una colección 'brands'
    // Como hack rápido, filtramos en memoria las marcas del config o hacemos una busqueda laxa.
    
    // NOTA: Para este refactor, asumiremos que pasamos el NOMBRE REAL o filtramos por slug si tu DB lo tiene.
    // Voy a usar el filtro por nombre que ya tenías funcionando.
    
    // Traemos TODO lo de esa marca (Marca + Campañas) en una sola llamada
    // OJO: Ajusta 'nombre_cuenta' si en tu DB usas otro campo para el nombre real
    const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        // Usamos un filtro "laxo" que intente coincidir (ajustar según tu DB real)
        filter: `(brand ~ "${brandSlug}" || nombre_cuenta ~ "${brandSlug}") && year = "${year}" && month_num = ${month}`,
        sort: '-cost_total_mes'
    });

    const brandReport = records.find(r => r.tipo_registro === 'Marca');
    const campaigns = records.filter(r => r.tipo_registro === 'Campaña');

    return { brandReport, campaigns };
}

