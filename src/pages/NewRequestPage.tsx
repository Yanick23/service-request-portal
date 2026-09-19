import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, firstFieldErrors } from '../api/client';
import { useCreateRequestMutation } from '../hooks/requests';
import { Alert } from '../components/Alert';
import { Field } from '../components/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateServiceRequestPayload, ServiceRequestPriority } from '../types/serviceRequest';

type FormState = CreateServiceRequestPayload;
type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  title: '', description: '', category: '', priority: 'MEDIUM', requesterName: '', requesterEmail: '',
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.title.trim().length < 3) errors.title = 'O título deve ter pelo menos 3 caracteres.';
  if (form.title.length > 120) errors.title = 'O título não pode exceder 120 caracteres.';
  if (form.description.trim().length < 10) errors.description = 'A descrição deve ter pelo menos 10 caracteres.';
  if (form.category.trim().length < 2) errors.category = 'A categoria é obrigatória.';
  if (form.requesterName.trim().length < 2) errors.requesterName = 'O nome do requerente é obrigatório.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requesterEmail)) errors.requesterEmail = 'Introduz um email válido.';
  return errors;
}

export function NewRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  const createMutation = useCreateRequestMutation();

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    createMutation.mutate(form, {
      onSuccess: (created) => navigate(`/requests/${created.id}`),
      onError: (err) => {
        if (err instanceof ApiError && err.isValidation()) {
          setErrors(firstFieldErrors(err.problem) as FormErrors);
        }
      },
    });
  }

  const showGenericError =
    createMutation.isError && !(createMutation.error instanceof ApiError && createMutation.error.isValidation());

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Novo pedido de assistência</h1>

      {showGenericError && (
        <div className="mb-4">
          <Alert variant="danger">Não foi possível criar o pedido. Tenta novamente.</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Título" htmlFor="title" error={errors.title}>
          <Input id="title" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
        </Field>

        <Field label="Descrição" htmlFor="description" error={errors.description}>
          <Textarea id="description" value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
        </Field>

        <Field label="Categoria" htmlFor="category" error={errors.category}>
          <Input id="category" value={form.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="Ex: Access, Billing, Network" />
        </Field>

        <Field label="Prioridade" htmlFor="priority">
          <Select value={form.priority} onValueChange={(value) => handleChange('priority', value as ServiceRequestPriority)}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Baixa</SelectItem>
              <SelectItem value="MEDIUM">Média</SelectItem>
              <SelectItem value="HIGH">Alta</SelectItem>
              <SelectItem value="CRITICAL">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Nome do requerente" htmlFor="requesterName" error={errors.requesterName}>
          <Input id="requesterName" value={form.requesterName} onChange={(e) => handleChange('requesterName', e.target.value)} />
        </Field>

        <Field label="Email do requerente" htmlFor="requesterEmail" error={errors.requesterEmail}>
          <Input id="requesterEmail" type="email" value={form.requesterEmail} onChange={(e) => handleChange('requesterEmail', e.target.value)} />
        </Field>

        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'A criar…' : 'Criar pedido'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/requests')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
