import { Request, Response } from "express";
import * as AccessoriesPurchaseController from "../../accessoriesPurchase.js";

export const createAccessoriesPurchase =
  AccessoriesPurchaseController.createAccessoriesPurchase;

export const getAccessoriesPurchases =
  AccessoriesPurchaseController.getAccessoriesPurchases;

export const getAccessoriesPurchaseById =
  AccessoriesPurchaseController.getAccessoriesPurchaseById;

export const updateAccessoriesPurchase =
  AccessoriesPurchaseController.updateAccessoriesPurchase;

export const verifyAccessoriesPurchase =
  AccessoriesPurchaseController.verifyAccessoriesPurchase;

export const deleteAccessoriesPurchase =
  AccessoriesPurchaseController.deleteAccessoriesPurchase;

export const getAccessoriesPurchaseBillNo =
  AccessoriesPurchaseController.getAccessoriesPurchaseBillNo;

export const updateAccessoriesPurchaseItemStatus =
  AccessoriesPurchaseController.updateAccessoriesPurchaseItemStatus;

export const getAccessoriesInventory =
  AccessoriesPurchaseController.getAccessoriesInventory;