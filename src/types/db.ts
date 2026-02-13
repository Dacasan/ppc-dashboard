// src/types/db.ts

export interface CampaignReport {
    id: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    
    // Campos de Identificación
    nombre_cuenta: string;
    brand: string;           // Ej: "A1 SMILE"
    campaign_id: string;
    campaign_name: string;   // Ej: "Implantes Cancún"
    tipo_registro: string;   // "Campaña"
    
    // Fechas
    fecha: string;
    mes: string;             // Ej: "January"
    year: string;            // Ej: "2025"
    month_num: number;

    // Métricas Totales (Mes)
    cost_total_mes: number;
    leads_total_mes: number;

    // Métricas por Bloques de 5 días (Para la vista de Mes)
    cost_01_05: number; leads_01_05: number;
    cost_06_10: number; leads_06_10: number;
    cost_11_15: number; leads_11_15: number;
    cost_16_20: number; leads_16_20: number;
    cost_21_25: number; leads_21_25: number;
    cost_26_31: number; leads_26_31: number;
    
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
