import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { serviceRequestApi } from '../api/client';
import type { ListRequestsParams } from '../types/serviceRequest';

export function useRequestsQuery(params: ListRequestsParams) {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => serviceRequestApi.list(params),
    placeholderData: keepPreviousData,
  });
}
