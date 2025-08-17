
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface ReviewStatusFilterProps {
  selectedStatus?: boolean;
  onStatusChange: (status?: boolean) => void;
}

export function ReviewStatusFilter({ 
  selectedStatus, 
  onStatusChange 
}: ReviewStatusFilterProps) {
  const getValueFromStatus = (status?: boolean) => {
    if (status === undefined) return "all";
    return status ? "reviewed" : "not_reviewed";
  };

  const getStatusFromValue = (value: string) => {
    if (value === "all") return undefined;
    return value === "reviewed";
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Status de Revisão</Label>
      <Select
        value={getValueFromStatus(selectedStatus)}
        onValueChange={(value) => onStatusChange(getStatusFromValue(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="reviewed">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              Revisados
            </div>
          </SelectItem>
          <SelectItem value="not_reviewed">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              Não revisados
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
