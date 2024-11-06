import {type InferRawDocType, model, type Model, Schema} from "mongoose";
import * as mongoose from "mongoose";

export interface IFoo {
    _id: mongoose.Types.ObjectId;
    name: string;
    surname: string;
    email: string|null;
    number: number;
}

interface IFooMethods {
    fullName: () => string
}

type TFooModel = Model<IFoo, {}, IFooMethods>;

const fooSchema = new Schema<IFoo, TFooModel, IFooMethods>({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: false },
    number: { type: Number, required: true, min: 0, max: 10 },
});
fooSchema.method('fullName', function fullName() {
    return `${this.name} ${this.surname}`;
})

export const Foo = model<IFoo, TFooModel>('Foo', fooSchema);

export type TFoo = InferRawDocType<typeof fooSchema>;