import { Request } from 'express';
import { JWTUser } from './auth';

export interface AuthenticatedRequest extends Request {
  user?: JWTUser;
  body: any;
  query: any;
  params: any;
}
