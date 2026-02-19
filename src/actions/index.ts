import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { pb } from '../lib/pb';
import type { CampaignReport } from '../types/db';

// Sanitize string for PocketBase filter queries (prevent filter injection)
function sanitize(str: string): string {
  return str.replace(/"/g, '\\"');
}

// --- Types ---

export type BrandOption = {
  name: string;
  slug: string;
  emoji: string;
};

// --- Actions ---
// Zero Client-Side Math: el backend pre-calcula TODO.
// El frontend solo lee y muestra.

export const server = {
  // Obtener marcas unicas (excluye GLOBAL)
  getUniqueBrands: defineAction({
    handler: async () => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `tipo_registro = "Marca" && brand != "GLOBAL"`,
        fields: 'brand, nombre_cuenta',
        sort: 'brand',
      });

      const uniqueNames = [...new Set(
        records.map(r => r.brand || r.nombre_cuenta || 'Desconocido')
      )];

      return uniqueNames.map(name => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        emoji: '🦷',
      }));
    },
  }),

  // Estadisticas globales (mes) → UNA sola fila GLOBAL pre-calculada
  getGlobalStats: defineAction({
    input: z.object({
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ year, month }) => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${sanitize(year)}" && month_num = ${month} && tipo_registro = "Marca" && brand = "GLOBAL"`,
        requestKey: `global-stats-${year}-${month}`,
      });

      return records[0] || null;
    },
  }),

  // Ranking de marcas por gasto (mes) - excluye GLOBAL
  getBrandsRanking: defineAction({
    input: z.object({
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ year, month }) => {
      return await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${sanitize(year)}" && month_num = ${month} && tipo_registro = "Marca" && brand != "GLOBAL"`,
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
        filter: `year = "${sanitize(year)}" && month_num = ${month} && tipo_registro = "Campaña"`,
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
      return await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `year = "${sanitize(year)}" && tipo_registro = "Marca" && brand = "GLOBAL"`,
        sort: 'month_num',
      });
    },
  }),

  // Datos completos de una marca (mes): registro Marca + sus Campañas (filtro por brand, NO por cuenta)
  getBrandFullData: defineAction({
    input: z.object({
      brandName: z.string(),
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ brandName, year, month }) => {
      const records = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `brand = "${sanitize(brandName)}" && year = "${sanitize(year)}" && month_num = ${month}`,
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
      const monthlyReports = await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `brand = "${sanitize(brandName)}" && year = "${sanitize(year)}" && tipo_registro = "Marca"`,
        sort: 'month_num',
      });

      return monthlyReports;
    },
  }),

  // Obtener una campaña individual por ID
  getCampaignById: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ id }) => {
      try {
        return await pb.collection('campaign_reports').getOne<CampaignReport>(sanitize(id));
      } catch {
        return null;
      }
    },
  }),

  // Datos históricos de una campaña (todos los meses)
  getCampaignHistory: defineAction({
    input: z.object({
      campaignName: z.string(),
      brandName: z.string(),
      year: z.string(),
    }),
    handler: async ({ campaignName, brandName, year }) => {
      return await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `campaign_name = "${sanitize(campaignName)}" && brand = "${sanitize(brandName)}" && year = "${sanitize(year)}" && tipo_registro = "Campaña"`,
        sort: 'month_num',
      });
    },
  }),

  // Campañas de una marca (filtro por brand, NO por cuenta)
  getBrandCampaigns: defineAction({
    input: z.object({
      brandName: z.string(),
      year: z.string(),
      month: z.number().min(1).max(12),
    }),
    handler: async ({ brandName, year, month }) => {
      return await pb.collection('campaign_reports').getFullList<CampaignReport>({
        filter: `brand = "${sanitize(brandName)}" && year = "${sanitize(year)}" && month_num = ${month} && tipo_registro = "Campaña"`,
        sort: '-cost_total_mes',
      });
    },
  }),
};
