import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, ZoomIn, RotateCw, Trash2 } from 'lucide-react';

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  onProcess: () => void;
  isProcessing: boolean;
}

export function ImagePreview({ file, onRemove, onProcess, isProcessing }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [rotation, setRotation] = React.useState(0);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileTypeColor = (type: string) => {
    if (type.includes('pdf')) return 'bg-red-100 text-red-800';
    if (type.includes('png')) return 'bg-blue-100 text-blue-800';
    if (type.includes('jpeg') || type.includes('jpg')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* File Info Header */}
      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6 text-primary" />
          <div>
            <p className="font-medium">{file.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <Badge variant="secondary" className={getFileTypeColor(file.type)}>
                {file.type.split('/')[1]?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Preview */}
      {file.type.startsWith('image/') && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Preview da Imagem</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    title="Girar imagem"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<img src="${imageUrl}" style="max-width: 100%; height: auto;" />`);
                      }
                    }}
                    title="Ver em tamanho completo"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={imageUrl}
                  alt="Preview do extrato"
                  className="w-full h-auto max-h-96 object-contain"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Preview Notice */}
      {file.type === 'application/pdf' && (
        <Card>
          <CardContent className="p-4 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Arquivo PDF selecionado. O OCR processará todas as páginas do documento.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Processing Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Dicas para melhor OCR:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Certifique-se que o texto está legível e não está cortado</li>
          <li>• Evite reflexos ou sombras na imagem</li>
          <li>• Use a rotação se necessário para deixar o texto na horizontal</li>
          <li>• Imagens com boa resolução produzem melhores resultados</li>
        </ul>
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onProcess}
          disabled={isProcessing}
          size="lg"
          className="px-8"
        >
          {isProcessing ? 'Extraindo transações...' : 'Extrair Transações com OCR'}
        </Button>
      </div>
    </div>
  );
}