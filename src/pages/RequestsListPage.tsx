import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRequestsQuery } from '../hooks/requests';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ServiceRequestStatus, ServiceRequestPriority } from '../types/serviceRequest';

const STATUS_OPTIONS: ServiceRequestStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS: ServiceRequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALL = 'ALL';

export function RequestsListPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ServiceRequestStatus | ''>('');
  const [priority, setPriority] = useState<ServiceRequestPriority | ''>('');
  const [sort, setSort] = useState<'createdAt' | '-createdAt'>('-createdAt');

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const { data, isLoading, isError, error } = useRequestsQuery({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    sort,
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Pedidos de assistência</h1>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <Input
          type="text"
          className="w-full sm:w-56"
          placeholder="Pesquisar por título ou requerente"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <Select
          value={status || ALL}
          onValueChange={(value) => {
            setStatus(value === ALL ? '' : (value as ServiceRequestStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os estados</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priority || ALL}
          onValueChange={(value) => {
            setPriority(value === ALL ? '' : (value as ServiceRequestPriority));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as prioridades</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as 'createdAt' | '-createdAt')}>
          <SelectTrigger className="w-full sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-createdAt">Mais recentes primeiro</SelectItem>
            <SelectItem value="createdAt">Mais antigos primeiro</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button asChild className="w-full sm:w-auto">
          <Link to="/requests/new">+ Novo pedido</Link>
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">A carregar pedidos...</p>}

      {isError && <Alert variant="danger">Não foi possível carregar os pedidos: {(error as Error).message}</Alert>}

      {data && data.items.length === 0 && <p className="text-muted-foreground">Nenhum pedido encontrado.</p>}

      {data && data.items.length > 0 && (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Requerente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Link to={`/requests/${item.id}`} className="text-primary hover:underline">{item.title}</Link></TableCell>
                    <TableCell>{item.requesterName}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString('pt-PT')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span>Página {data.page} de {data.totalPages} ({data.total} pedidos)</span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Seguinte</Button>
          </div>
        </>
      )}
    </div>
  );
}
