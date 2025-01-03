import {type HydratedDocument, type InferRawDocType, model, type Model, Schema, Types} from "mongoose";

export interface ICategory {
    _id: Types.ObjectId;
    name: string;
    description: string;
}

type TCategoryModel = Model<ICategory>;
export type THydratedCategoryDocument = HydratedDocument<ICategory>;

const categorySchema = new Schema<ICategory, TCategoryModel>({
    name: { type: String, required: true },
    description: { type: String, required: true },
});

export const Category = model<ICategory, TCategoryModel>('Category', categorySchema);
export type TCategory = InferRawDocType<typeof categorySchema>;