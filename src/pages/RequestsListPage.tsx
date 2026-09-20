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
import { STATUS_VALUES, PRIORITY_VALUES, type ServiceRequestStatus, type ServiceRequestPriority } from '../types/serviceRequest';

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
            {STATUS_VALUES.map((s) => (
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
            {PRIORITY_VALUES.map((p) => (
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
          <div className="grid gap-3 sm:hidden">
            {data.items.map((item) => (
              <Link
                key={item.id}
                to={`/requests/${item.id}`}
                className="block rounded-lg border p-4 hover:bg-accent"
              >
                <p className="font-medium text-primary">{item.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={item.status} />
                  <PriorityBadge priority={item.priority} />
                </div>
                <dl className="mt-2.5 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>Requerente</dt>
                    <dd>{item.requesterName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Criado em</dt>
                    <dd>{new Date(item.createdAt).toLocaleDateString('pt-PT')}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          <div className="hidden rounded-lg border sm:block">
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
