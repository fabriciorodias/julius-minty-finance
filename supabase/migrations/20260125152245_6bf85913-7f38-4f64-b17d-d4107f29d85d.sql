-- Aplicar presets de cores nas instituições existentes

-- Nubank
UPDATE institutions 
SET primary_color = '#8A05BE', 
    secondary_color = '#BA4AE2',
    logo_url = 'https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-1.png'
WHERE id = '84a16eda-8089-4982-8ba7-fca4666d45c9';

-- Inter
UPDATE institutions 
SET primary_color = '#FF7A00', 
    secondary_color = '#FF9933',
    logo_url = 'https://logodownload.org/wp-content/uploads/2019/09/banco-inter-logo-1.png'
WHERE id = '05aaca89-0ade-4d46-a53f-633cb2413643';

-- C6 Bank
UPDATE institutions 
SET primary_color = '#1A1A1A', 
    secondary_color = '#333333',
    logo_url = 'https://logodownload.org/wp-content/uploads/2020/02/c6-bank-logo-0.png'
WHERE id = '824d887b-1692-4e38-a49c-e69a4f9d3a1b';

-- Mercado Pago
UPDATE institutions 
SET primary_color = '#009EE3', 
    secondary_color = '#00B1FF',
    logo_url = 'https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo-0.png'
WHERE id = '06ca0785-aa08-4d1b-8fcc-af78a3fcd038';

-- Banco do Nordeste
UPDATE institutions 
SET primary_color = '#E31837', 
    secondary_color = '#FFFFFF',
    logo_url = 'https://logodownload.org/wp-content/uploads/2017/10/banco-do-nordeste-logo-0.png'
WHERE id = '73172579-b004-49e5-a1c4-5a5463cb290d';

-- Carteira
UPDATE institutions 
SET primary_color = '#10B981', 
    secondary_color = '#34D399'
WHERE id = 'f7a37c75-9d40-434e-b6f8-fe1fa9fc269e';