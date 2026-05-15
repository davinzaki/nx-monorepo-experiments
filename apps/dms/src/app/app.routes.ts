import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'orders', pathMatch: 'full' },
  {
    path: 'orders',
    loadComponent: () =>
      import('@aras-pro/dms/feature-orders').then((m) => m.FeatureOrders),
  },
];
