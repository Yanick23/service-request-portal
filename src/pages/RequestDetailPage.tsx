import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useRequestQuery, useUpdateRequestStatusMutation } from '../hooks/requests';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Button } from '@/components/ui/button';
import { ALLOWED_TRANSITIONS } from '../types/serviceRequest';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading, isError } = useRequestQuery(id);
  const statusMutation = useUpdateRequestStatusMutation(id);

  if (isLoading) return <p className="text-muted-foreground">A carregar pedido...</p>;
  if (isError || !request) return <p role="alert">Não foi possível carregar este pedido.</p>;

  const possibleNextStatuses = ALLOWED_TRANSITIONS[request.status];

  return (
    <div>
      <button className="mb-4 block text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/requests')}>
        ← Voltar à lista
      </button>

      <h1 className="text-xl font-semibold">{request.title}</h1>
      <p className="mt-2 text-foreground">{request.description}</p>

      <div className="my-5 flex flex-col gap-1.5 text-sm text-muted-foreground">
        <span>Requerente: {request.requesterName} ({request.requesterEmail})</span>
        <span className="flex items-center gap-1.5">
          Categoria: {request.category} · Prioridade <PriorityBadge priority={request.priority} />
        </span>
        <span className="flex items-center gap-1.5">
          Status atual: <StatusBadge status={request.status} /> (versão {request.version})
        </span>
      </div>

      {statusMutation.isError && statusMutation.error instanceof ApiError && statusMutation.error.isConflict && (
        <div className="mb-4">
          <Alert variant="warning">
            Este pedido foi alterado por outra pessoa entretanto. Os dados foram atualizados — confirma antes de tentares de novo.
          </Alert>
        </div>
      )}

      {statusMutation.isError && statusMutation.error instanceof ApiError && !statusMutation.error.isConflict && (
        <div className="mb-4">
          <Alert variant="danger">{statusMutation.error.message}</Alert>
        </div>
      )}

      <h2 className="mt-6 mb-2 text-base font-semibold">Mudar status</h2>
      {possibleNextStatuses.length === 0 && <p className="text-muted-foreground">Este pedido está fechado, sem mais transições possíveis.</p>}

      <div className="flex flex-wrap gap-2">
        {possibleNextStatuses.map((nextStatus) => (
          <Button
            key={nextStatus}
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate({ status: nextStatus, version: request.version })}
          >
            {statusMutation.isPending ? 'A atualizar...' : `Marcar como ${nextStatus}`}
          </Button>
        ))}
      </div>
    </div>
  );
}
