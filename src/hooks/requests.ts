import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ApiError, serviceRequestApi } from '../api/client';
import type {
  CreateServiceRequestPayload,
  ListRequestsParams,
  ServiceRequestStatus,
} from '../types/serviceRequest';

export function useRequestsQuery(params: ListRequestsParams) {
  return useQuery({
    queryKey: ['requests', params],
    queryFn: () => serviceRequestApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateRequestMutation() {
  return useMutation({
    mutationFn: (payload: CreateServiceRequestPayload) => serviceRequestApi.create(payload),
  });
}

export function useRequestQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => serviceRequestApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateRequestStatusMutation(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ status, version }: { status: ServiceRequestStatus; version: number }) =>
      serviceRequestApi.updateStatus(id!, { status, version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isConflict) {
        queryClient.invalidateQueries({ queryKey: ['requests', id] });
      }
    },
  });
}
