import {Types} from "mongoose";
import {Category, type ICategory} from "../schema/db/category.schema.ts";

/**
 * Checks if a given category exists by a given id.
 * @param id
 */
export async function exists(id: Types.ObjectId|string): Promise<boolean> {
    if (typeof id === "string" && !Types.ObjectId.isValid(id))
        return false;

    const result = await Category.exists({ _id: id });

    return result !== null;
}

/**
 * Lists all available categories.
 */
export async function list(): Promise<Array<ICategory>> {
    const categories = await Category.find();
    return categories.map(category => category.toObject());
}