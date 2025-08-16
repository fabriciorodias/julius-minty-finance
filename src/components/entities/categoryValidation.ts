
import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Nome da categoria é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome não pode ter mais de 50 caracteres')
    .trim(),
  type: z.enum(['receita', 'despesa'], {
    required_error: 'Tipo da categoria é obrigatório',
  }),
  parent_id: z.string().nullable(),
  is_active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
