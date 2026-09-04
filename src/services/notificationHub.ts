import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { Notification } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://stratoflow.stratopod.co.za/api').replace(/\/$/, '');

export function getNotificationHubUrl() {
  return `${API_BASE}/hubs/notifications`;
}

export function createNotificationHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(getNotificationHubUrl(), {
      accessTokenFactory: () => localStorage.getItem('token') ?? '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .build();
}

export type { Notification };
