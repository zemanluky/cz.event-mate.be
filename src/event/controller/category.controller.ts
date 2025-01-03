import express, { type Response } from "express";
import type { AppRequest } from "../types";
import { successResponse } from "../helper/response.helper.ts";
import {list} from "../service/category.service.ts";

export const categoryController = express.Router();

/**
 * Gets a list of all categories.
 */
categoryController.get('/', async (req: AppRequest, res: Response) => {
    successResponse(res, await list());
});