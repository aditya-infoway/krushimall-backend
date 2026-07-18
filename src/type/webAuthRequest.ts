// src/types/webAuthRequest.ts

import { Request } from "express";

export interface WebAuthedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };

  vendor?: {
    vendorId: number;
    userId: number;
    email: string;
    role: string;
  };
}