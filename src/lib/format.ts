// 1. Formatear Dinero (MXN sin decimales)
export const formatMoney = (amount: number | undefined) => {
  const num = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount || 0);
  return `${num} MXN`;
};

// 2. Formatear Números (1,234)
export const formatNumber = (num: number | undefined) => {
  return new Intl.NumberFormat('es-MX').format(num || 0);
};

// 3. Obtener color del CPL (Semáforo)
// Verde < $800 | Amarillo < $1200 | Naranja >= $1200
export const getCplColor = (cpl: number) => {
  if (cpl === 0) return 'text-zinc-400 bg-zinc-100 border-zinc-200';
  if (cpl < 800) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (cpl < 1200) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  return 'text-orange-700 bg-orange-50 border-orange-200';
};

// 4. Helper para canales (Iconos y colores)
export const getChannelInfo = (name: string) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('google') || n.includes('sem') || n.includes('search')) 
        return { name: 'Google Ads', icon: 'fa-google', color: 'text-blue-600 bg-blue-50' };
    if (n.includes('meta') || n.includes('fb') || n.includes('instagram')) 
        return { name: 'Meta Ads', icon: 'fa-meta', color: 'text-blue-700 bg-blue-50' }; // Meta azul/morado
    if (n.includes('tiktok')) 
        return { name: 'TikTok', icon: 'fa-tiktok', color: 'text-black bg-zinc-100' };
    
    return { name: 'Otro', icon: 'fa-bullhorn', color: 'text-zinc-600 bg-zinc-50' };
};
