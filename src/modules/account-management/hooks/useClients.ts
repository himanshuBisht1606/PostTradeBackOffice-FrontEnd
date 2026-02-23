import { useQuery } from '@tanstack/react-query';
import { getClients, getClientById } from '../services/clientService';
import type { ClientListParams } from '../services/clientService';

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => getClients(params),
    staleTime: 30_000,
  });
}

export function useClientDetail(id: string | null) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => getClientById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
