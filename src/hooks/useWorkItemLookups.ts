import { useQuery } from '@tanstack/react-query';
import { lookupsApi, usersApi } from '../services/stratoApi';

export function useWorkItemLookups() {
  const lookups = useQuery({
    queryKey: ['lookups'],
    queryFn: () => lookupsApi.getAll(),
  });

  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  return {
    priorities: lookups.data?.priorities ?? [],
    statuses: lookups.data?.statuses ?? [],
    workItemTypes: lookups.data?.workItemTypes ?? [],
    projects: lookups.data?.projects ?? [],
    goals: lookups.data?.goals ?? [],
    users: users.data ?? [],
    isLoading: lookups.isLoading || users.isLoading,
  };
}
