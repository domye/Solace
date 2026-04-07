import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api';
import { extractData } from './utils';
import type { Owner } from '@/types';

/**
 * 获取站长公开信息
 */
export function useOwner() {
  return useQuery({
    queryKey: ['owner'],
    queryFn: async () => {
      const response = await apiClient.owner.getOwner();
      return extractData<Owner>(response);
    },
    staleTime: 30 * 60 * 1000,
  });
}