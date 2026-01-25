// Presets de bancos brasileiros com cores e logos
// Logos locais armazenadas em src/assets/logos/

import nubankLogo from '@/assets/logos/nubank-logo.png';
import interLogo from '@/assets/logos/banco-inter-logo.svg';
import c6Logo from '@/assets/logos/c6-bank-logo.png';
import mercadoPagoLogo from '@/assets/logos/mercado-pago-logo.png';
import bnbLogo from '@/assets/logos/bnb-logo.svg';

export interface BankPreset {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export const BANK_PRESETS: Record<string, BankPreset> = {
  // Bancos Digitais
  'Nubank': {
    name: 'Nubank',
    primaryColor: '#8A05BE',
    secondaryColor: '#BA4AE2',
    logoUrl: nubankLogo,
  },
  'Inter': {
    name: 'Inter',
    primaryColor: '#FF7A00',
    secondaryColor: '#FF9933',
    logoUrl: interLogo,
  },
  'C6': {
    name: 'C6 Bank',
    primaryColor: '#1A1A1A',
    secondaryColor: '#333333',
    logoUrl: c6Logo,
  },
  'C6 Bank': {
    name: 'C6 Bank',
    primaryColor: '#1A1A1A',
    secondaryColor: '#333333',
    logoUrl: c6Logo,
  },
  'Neon': {
    name: 'Neon',
    primaryColor: '#00C8FF',
    secondaryColor: '#00A3D9',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2019/08/neon-logo-0.png',
  },
  'Original': {
    name: 'Banco Original',
    primaryColor: '#00A650',
    secondaryColor: '#00C853',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2017/10/banco-original-logo.png',
  },
  'PicPay': {
    name: 'PicPay',
    primaryColor: '#21C25E',
    secondaryColor: '#1A9E4B',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2018/05/picpay-logo-0.png',
  },
  'PagBank': {
    name: 'PagBank',
    primaryColor: '#00A859',
    secondaryColor: '#008C4A',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2019/09/pagbank-logo-0.png',
  },
  'Mercado Pago': {
    name: 'Mercado Pago',
    primaryColor: '#009EE3',
    secondaryColor: '#00B1FF',
    logoUrl: mercadoPagoLogo,
  },
  'Next': {
    name: 'Next',
    primaryColor: '#00FF87',
    secondaryColor: '#00CC6A',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2017/10/next-logo-0.png',
  },
  'Iti': {
    name: 'Iti',
    primaryColor: '#FF6900',
    secondaryColor: '#FF8533',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2020/02/iti-logo-0.png',
  },
  
  // Bancos Tradicionais
  'Itaú': {
    name: 'Itaú',
    primaryColor: '#EC7000',
    secondaryColor: '#003399',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/itau-logo-0.png',
  },
  'Bradesco': {
    name: 'Bradesco',
    primaryColor: '#CC092F',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/bradesco-logo-0.png',
  },
  'Banco do Brasil': {
    name: 'Banco do Brasil',
    primaryColor: '#FFCC00',
    secondaryColor: '#003399',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/banco-do-brasil-logo-0.png',
  },
  'Santander': {
    name: 'Santander',
    primaryColor: '#EC0000',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/santander-logo-0.png',
  },
  'Caixa': {
    name: 'Caixa',
    primaryColor: '#005CA9',
    secondaryColor: '#F37021',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2014/05/caixa-logo-0.png',
  },
  'Banco do Nordeste': {
    name: 'Banco do Nordeste',
    primaryColor: '#E31837',
    secondaryColor: '#FFFFFF',
    logoUrl: bnbLogo,
  },
  'Banrisul': {
    name: 'Banrisul',
    primaryColor: '#005BAA',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2017/10/banrisul-logo-0.png',
  },
  'Sicredi': {
    name: 'Sicredi',
    primaryColor: '#00A14E',
    secondaryColor: '#FFD100',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2018/10/sicredi-logo-0.png',
  },
  'Sicoob': {
    name: 'Sicoob',
    primaryColor: '#003366',
    secondaryColor: '#00A54F',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2018/10/sicoob-logo-0.png',
  },
  
  // Corretoras e Investimentos
  'XP': {
    name: 'XP Investimentos',
    primaryColor: '#1D1D1B',
    secondaryColor: '#FFD700',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2019/11/xp-investimentos-logo-0.png',
  },
  'XP Investimentos': {
    name: 'XP Investimentos',
    primaryColor: '#1D1D1B',
    secondaryColor: '#FFD700',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2019/11/xp-investimentos-logo-0.png',
  },
  'BTG Pactual': {
    name: 'BTG Pactual',
    primaryColor: '#001E62',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2020/05/btg-pactual-logo-0.png',
  },
  'Rico': {
    name: 'Rico',
    primaryColor: '#FF5800',
    secondaryColor: '#1D1D1B',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2020/02/rico-logo-0.png',
  },
  'Clear': {
    name: 'Clear',
    primaryColor: '#00D1D1',
    secondaryColor: '#1D1D1B',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2020/02/clear-corretora-logo-0.png',
  },
  'Easynvest': {
    name: 'Easynvest',
    primaryColor: '#6200EA',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://logodownload.org/wp-content/uploads/2020/02/easynvest-logo-0.png',
  },
  'Toro': {
    name: 'Toro Investimentos',
    primaryColor: '#00B4D8',
    secondaryColor: '#FFFFFF',
  },
  'Avenue': {
    name: 'Avenue',
    primaryColor: '#6C5CE7',
    secondaryColor: '#FFFFFF',
  },
  'Genial': {
    name: 'Genial Investimentos',
    primaryColor: '#FF6B00',
    secondaryColor: '#FFFFFF',
  },
  
  // Carteiras e Outros
  'Carteira': {
    name: 'Carteira',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
  },
  'Dinheiro': {
    name: 'Dinheiro',
    primaryColor: '#10B981',
    secondaryColor: '#34D399',
  },
  'Cofre': {
    name: 'Cofre',
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
  },
};

// Função para encontrar preset por nome (fuzzy matching)
export function findBankPreset(institutionName: string): BankPreset | null {
  // Tenta match exato primeiro
  if (BANK_PRESETS[institutionName]) {
    return BANK_PRESETS[institutionName];
  }
  
  // Tenta match parcial (case insensitive)
  const normalizedName = institutionName.toLowerCase().trim();
  
  for (const [key, preset] of Object.entries(BANK_PRESETS)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      return preset;
    }
  }
  
  return null;
}

// Função para sugerir presets baseado em input parcial
export function suggestBankPresets(partialName: string): BankPreset[] {
  if (!partialName || partialName.length < 2) return [];
  
  const normalizedInput = partialName.toLowerCase().trim();
  
  const matches: BankPreset[] = [];
  const seenNames = new Set<string>();
  
  for (const [key, preset] of Object.entries(BANK_PRESETS)) {
    if (seenNames.has(preset.name)) continue;
    
    if (
      key.toLowerCase().includes(normalizedInput) || 
      preset.name.toLowerCase().includes(normalizedInput)
    ) {
      matches.push(preset);
      seenNames.add(preset.name);
    }
  }
  
  return matches.slice(0, 5); // Retorna no máximo 5 sugestões
}

// Cores predefinidas para seleção rápida
export const QUICK_COLORS = [
  { name: 'Roxo', color: '#8B5CF6' },
  { name: 'Azul', color: '#3B82F6' },
  { name: 'Verde', color: '#10B981' },
  { name: 'Laranja', color: '#F97316' },
  { name: 'Vermelho', color: '#EF4444' },
  { name: 'Rosa', color: '#EC4899' },
  { name: 'Amarelo', color: '#EAB308' },
  { name: 'Ciano', color: '#06B6D4' },
  { name: 'Cinza', color: '#6B7280' },
  { name: 'Preto', color: '#1F2937' },
];
