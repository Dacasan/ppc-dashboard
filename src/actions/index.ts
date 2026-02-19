import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { pb } from '../lib/pb';
import type { CampaignReport } from '../types/db';

// --- Types ---

export type BrandOption = {
  name: string;
  slug: string;
  emoji: string;
};

// --- Actions ---

export const server = {
  // Obtener marcas unicas desde PocketBase
  getUniqueBrands: defineAction({
    handler: async () => {
      const records = await pb.collection('campaign_reports').getList(1, 500, {
        sort: '-created',
        fields: 'brand, nombre_cuenta',
      });

      const uniqueNames = [...new Set(
        records.items.map(r => r.brand || r.nombre_cuenta || 'Desconocido')
      )];

      return uniqueNames.map(name => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        emoji: '🦷',
      }));
    },
  }),

  // Estadisticas globales del dashboard (mes)
  getGlobalStats: defineAction({
    input: z.object({
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ year, month }) => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Marca"`,
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
      };
    },
  }),

  // Ranking de marcas por gasto (mes)
  getBrandsRanking: defineAction({
    input: z.object({
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ year, month }) => {
      return await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Marca"`,
        sort: '-cost_total_mes',
      });
    },
  }),

  // Todas las campanas activas (mes)
  getAllCampaigns: defineAction({
    input: z.object({
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ year, month }) => {
      return await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${year}" && month_num = ${month} && tipo_registro = "Campaña"`,
        sort: '-cost_total_mes',
      });
    },
  }),

  // Estadisticas anuales globales
  getGlobalYearStats: defineAction({
    input: z.object({
      year: z.string(),
    }),
    handler: async ({ year }) => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${year}" && tipo_registro = "Marca"`,
      });

      let totalSpend = 0;
      let totalLeads = 0;
      records.forEach(r => {
        totalSpend += r.cost_total_mes || 0;
        totalLeads += r.leads_total_mes || 0;
      });

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
      };
    },
  }),

  // Datos completos de una marca (mes)
  getBrandFullData: defineAction({
    input: z.object({
      brandName: z.string(),
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ brandName, year, month }) => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `(brand ~ "${brandName}" || nombre_cuenta ~ "${brandName}") && year = "${year}" && month_num = ${month}`,
        sort: '-cost_total_mes',
      });

      const brandReport = records.find(r => r.tipo_registro === 'Marca') || null;
      const campaigns = records.filter(r => r.tipo_registro === 'Campaña');

      return { brandReport, campaigns };
    },
  }),

  // Datos anuales de una marca
  getBrandYearData: defineAction({
    input: z.object({
      brandName: z.string(),
      year: z.string(),
    }),
    handler: async ({ brandName, year }) => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `(brand ~ "${brandName}" || nombre_cuenta ~ "${brandName}") && year = "${year}"`,
        sort: 'month_num',
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
      };
    },
  }),
};
