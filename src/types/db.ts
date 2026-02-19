// src/types/db.ts
// Jerarquía de datos (tipo_registro):
//   "Campaña" → Campaña individual de Google Ads
//   "Marca"   → Suma de todas las campañas de una marca (DEX, TIJ, etc.)
//   "Cuenta"  → Suma de todas las marcas de una cuenta Google Ads
//   "GLOBAL"  → Gran total del sistema (brand = "GLOBAL")

export interface CampaignReport {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;

    // Campos de Identificación
    nombre_cuenta: string;
    brand: string;           // Ej: "DEX", "TIJ", "GLOBAL"
    campaign_id: string;
    campaign_name: string;   // Ej: "Implantes Cancún"
    tipo_registro: string;   // "Campaña" | "Marca" | "Cuenta" | "GLOBAL"
    unique_key: string;      // Clave única (ej: "TOTAL|GLOBAL|2026|2")

    // Fechas
    fecha: string;
    mes: string;             // Ej: "February"
    year: string;            // Ej: "2026"
    month_num: number;

    // Métricas Totales (Mes) - Pre-calculadas por el backend
    cost_total_mes: number;
    leads_total_mes: number;

    // Métricas por Bloques de 5 días - Pre-calculadas por el backend
    cost_01_05: number; leads_01_05: number;
    cost_06_10: number; leads_06_10: number;
    cost_11_15: number; leads_11_15: number;
    cost_16_20: number; leads_16_20: number;
    cost_21_25: number; leads_21_25: number;
    cost_26_31: number; leads_26_31: number;

    // Labels pre-generados para gráficos (ej: "1-5 Feb 2026")
    semana_01_05: string;
    semana_06_10: string;
    semana_11_15: string;
    semana_16_20: string;
    semana_21_25: string;
    semana_26_31: string;

    // Otros
    country_ads: string;
    state_ads: string;
    porcentaje_cuenta: number;
}

export interface LeadReport {
    id: string;
    collectionId: string;
    Nombre: string;
    Email: string;
    Telefono: string;
    Fecha: string;
    Dominio: string; // "A1 SMILE"
    Sources: string; // "Meta"
    Medium: string;  // "cpc"
    Mensaje: string;
    Leads_counter: number;
}
