import {type InferRawDocType, model, type Model, Schema} from "mongoose";
import * as mongoose from "mongoose";

export interface IEvent {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    date: Date;
    location: String;
    private: boolean;
    ownerId: mongoose.Types.ObjectId;
}

interface IEventsMethods {
    fullName: () => string
}

type TEventModel = Model<IEvent, {}, IEventsMethods>;

const eventSchema = new Schema<IEvent, TEventModel, IEventsMethods>({
    name: { type: String, required: true },
    description: { type: String, required: false },
    date: { type: Date, required: true },
    private: { type: Boolean, required: true },
    location: { type: String, required: true },
});

export const Event = model<IEvent, TEventModel>('Event', eventSchema);
  
export type TEvent = InferRawDocType<typeof eventSchema>;