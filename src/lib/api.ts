import { pb } from './pb';
import type { CampaignReport } from '../types/db';

export type BrandOption = {
  name: string;
  slug: string;
  emoji: string;
};

// Función para obtener marcas únicas desde PocketBase
export async function getUniqueBrands(): Promise<BrandOption[]> {
  try {
    // Pedimos los últimos 100 registros para escanear marcas recientes
    // Usamos 'fields' para traer SOLO el nombre de la marca y ahorrar datos
    const records = await pb.collection('campaign_reports').getList(1, 500, {
      sort: '-created',
      fields: 'brand, nombre_cuenta',
    });

    // Filtramos nombres únicos usando un Set
    // Normalizamos el nombre: si viene null, lo ignoramos
    const uniqueNames = [...new Set(records.items.map(r => r.brand || r.nombre_cuenta || 'Desconocido'))];

    // Mapeamos a un objeto limpio para el UI
    return uniqueNames.map(name => ({
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      emoji: '🦷' // Emoji default (luego podríamos personalizarlo por marca)
    }));

  } catch (error) {
    console.error("Error cargando marcas:", error);
    return []; // Retorna array vacío si falla para no romper la UI
  }
}
