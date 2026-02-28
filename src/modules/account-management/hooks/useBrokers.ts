import { useQuery } from '@tanstack/react-query';
import { getBrokerById } from '../services/brokerService';

export function useBrokerDetail(id: string | null) {
  return useQuery({
    queryKey: ['brokers', id],
    queryFn: () => getBrokerById(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}
