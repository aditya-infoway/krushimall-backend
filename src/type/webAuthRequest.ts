// src/types/webAuthRequest.ts

import { Request } from "express";

export interface WebAuthedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}