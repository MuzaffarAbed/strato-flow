import { useQuery } from '@tanstack/react-query';
import { lookupsApi, usersApi, workItemsApi } from '../services/stratoApi';

export function useTaskLookups() {
  const lookups = useQuery({
    queryKey: ['lookups'],
    queryFn: () => lookupsApi.getAll(),
  });

  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const workItems = useQuery({
    queryKey: ['workitems', 'lookup'],
    queryFn: () => workItemsApi.getAll({ page: 1, pageSize: 100 }),
  });

  return {
    priorities: lookups.data?.priorities ?? [],
    statuses: lookups.data?.statuses ?? [],
    users: users.data ?? [],
    workItems: workItems.data?.items ?? [],
    isLoading: lookups.isLoading || users.isLoading || workItems.isLoading,
  };
}
