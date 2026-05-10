import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from './api-url.token';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_URL);

  const apiReq = req.url.startsWith('http')
    ? req
    : req.clone({ url: `${baseUrl}${req.url}` });

  return next(apiReq);
};
