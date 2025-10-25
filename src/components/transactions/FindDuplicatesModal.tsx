import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotionButton } from '@/components/ui/notion-button';
import { Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useFindDuplicates, DuplicateGroup } from '@/hooks/useFindDuplicates';

interface FindDuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDuplicatesFound: (groups: DuplicateGroup[]) => void;
}

export function FindDuplicatesModal({
  isOpen,
  onClose,
  onDuplicatesFound,
}: FindDuplicatesModalProps) {
  const { findDuplicates, duplicateGroups, isLoading, error, scannedCount } = useFindDuplicates();

  const handleStartScan = async () => {
    await findDuplicates();
  };

  useEffect(() => {
    if (duplicateGroups.length > 0 && !isLoading) {
      onDuplicatesFound(duplicateGroups);
    }
  }, [duplicateGroups, isLoading, onDuplicatesFound]);

  const renderContent = () => {
    // Estado: Erro
    if (error && !isLoading) {
      return (
        <>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 bg-destructive/10 rounded-full">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Erro ao escanear</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <NotionButton onClick={onClose} variant="outline">
              Fechar
            </NotionButton>
            <NotionButton onClick={handleStartScan}>
              Tentar Novamente
            </NotionButton>
          </div>
        </>
      );
    }

    // Estado: Processando
    if (isLoading) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Analisando lançamentos...</h3>
            <p className="text-sm text-muted-foreground">
              Procurando duplicatas em todas as suas contas
            </p>
            {scannedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {scannedCount} lançamentos escaneados
              </p>
            )}
          </div>
        </div>
      );
    }

    // Estado: Nenhuma duplicata encontrada (após scan)
    if (duplicateGroups.length === 0 && scannedCount > 0) {
      return (
        <>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhuma duplicata encontrada!</h3>
              <p className="text-sm text-muted-foreground">
                Seus lançamentos estão organizados.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {scannedCount} lançamentos analisados
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <NotionButton onClick={onClose}>
              Fechar
            </NotionButton>
          </div>
        </>
      );
    }

    // Estado: Inicial (explicação)
    return (
      <>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Copy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Como funciona</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Detectamos lançamentos com valores idênticos</li>
                <li>• Dentro da mesma conta</li>
                <li>• Separados por até 30 dias</li>
                <li>• Você decide quais excluir</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <NotionButton onClick={onClose} variant="outline">
            Cancelar
          </NotionButton>
          <NotionButton onClick={handleStartScan}>
            Escanear Lançamentos
          </NotionButton>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encontrar Duplicatas</DialogTitle>
          <DialogDescription>
            Identifique e remova lançamentos duplicados
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
