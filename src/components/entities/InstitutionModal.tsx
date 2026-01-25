
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { Institution } from '@/hooks/useInstitutions';
import { findBankPreset, suggestBankPresets, BankPreset } from '@/lib/bank-presets';
import { Sparkles, X } from 'lucide-react';

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (institutionData: any) => void;
  institution?: Institution;
  isLoading?: boolean;
}

export function InstitutionModal({ isOpen, onClose, onSubmit, institution, isLoading }: InstitutionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    logo_url: '',
    primary_color: '',
    secondary_color: '',
  });
  const [suggestions, setSuggestions] = useState<BankPreset[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name,
        is_active: institution.is_active,
        logo_url: institution.logo_url || '',
        primary_color: institution.primary_color || '',
        secondary_color: institution.secondary_color || '',
      });
    } else {
      setFormData({
        name: '',
        is_active: true,
        logo_url: '',
        primary_color: '',
        secondary_color: '',
      });
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, [institution, isOpen]);

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    
    // Buscar sugestões de presets
    if (name.length >= 2) {
      const presetSuggestions = suggestBankPresets(name);
      setSuggestions(presetSuggestions);
      setShowSuggestions(presetSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleApplyPreset = (preset: BankPreset) => {
    setFormData({
      ...formData,
      name: preset.name,
      primary_color: preset.primaryColor,
      secondary_color: preset.secondaryColor,
      logo_url: preset.logoUrl || '',
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleAutoFill = () => {
    const preset = findBankPreset(formData.name);
    if (preset) {
      handleApplyPreset(preset);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (institution) {
      onSubmit({ id: institution.id, ...formData });
    } else {
      onSubmit(formData);
    }
    onClose();
  };

  const hasPreset = findBankPreset(formData.name) !== null;
  const previewColor = formData.primary_color || '#6B7280';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {institution ? 'Editar Instituição' : 'Nova Instituição'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview do Card */}
          <div 
            className="p-4 rounded-lg border-l-4 transition-colors"
            style={{ 
              borderLeftColor: previewColor,
              backgroundColor: `${previewColor}08`
            }}
          >
            <div className="flex items-center gap-3">
              {formData.logo_url ? (
                <img 
                  src={formData.logo_url} 
                  alt={formData.name || 'Logo'} 
                  className="h-8 w-auto max-w-[80px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: previewColor }}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{formData.name || 'Nome da Instituição'}</p>
                <p className="text-xs text-muted-foreground">Preview do card</p>
              </div>
            </div>
          </div>

          {/* Nome com sugestões */}
          <div className="space-y-2 relative">
            <Label htmlFor="name">Nome da Instituição</Label>
            <div className="flex gap-2">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Nubank, Itaú, XP Investimentos..."
                required
                className="flex-1"
              />
              {hasPreset && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleAutoFill}
                  title="Aplicar cores do banco automaticamente"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </Button>
              )}
            </div>
            
            {/* Sugestões de presets */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                <div className="p-1">
                  {suggestions.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-sm text-left"
                      onClick={() => handleApplyPreset(preset)}
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span className="text-sm">{preset.name}</span>
                      <Sparkles className="h-3 w-3 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 hover:bg-accent rounded"
                  onClick={() => setShowSuggestions(false)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              label="Cor Primária"
              value={formData.primary_color}
              onChange={(color) => setFormData({ ...formData, primary_color: color })}
              placeholder="#8B5CF6"
            />
            <ColorPicker
              label="Cor Secundária"
              value={formData.secondary_color}
              onChange={(color) => setFormData({ ...formData, secondary_color: color })}
              placeholder="#A855F7"
            />
          </div>

          {/* URL da Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo_url">URL da Logo (opcional)</Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Cole a URL de uma imagem da logo do banco/instituição
            </p>
          </div>

          {institution && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active">Instituição ativa</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {institution ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
