import { Request, Response } from "express";
import * as OrderController from "../../order.js";

export const createOrder = async (req: Request, res: Response) => {
  const user = (req as any).user;

  req.body.createdType = user.role?.toUpperCase().replace(/\s+/g, "_");
  req.body.createdBy = user?.employeeName || user?.name;
  req.body.createdById = user?.id;

  return OrderController.createOrder(req, res);
};

export const getOrders = OrderController.getOrders;

export const getOrderById = OrderController.getOrderById;

export const getOrderByLeadId = OrderController.getOrderByLeadId;
export const printDeliveryChallan = OrderController.printDeliveryChallan;
export const deleteOrder = OrderController.deleteOrder;