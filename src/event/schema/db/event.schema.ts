import {
    type HydratedDocument,
    type InferRawDocType,
    model,
    type Model,
    Schema,
    Types
} from "mongoose";

export interface IEvent {
    _id: Types.ObjectId;
    name: string;
    description?: string|null;
    date: Date;
    location: string;
    private: boolean;
    category: Types.ObjectId;
    ownerId: Types.ObjectId;
    attendees: Types.ObjectId[];
    image_paths: string[];
}

type TEventModel = Model<IEvent>;

export type THydratedEventDocument = HydratedDocument<IEvent>;

const eventSchema = new Schema<IEvent, TEventModel>({
    name: { type: String, required: true },
    description: { type: String, required: false, default: null },
    date: { type: Date, required: true },
    private: { type: Boolean, required: true }, 
    location: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
    ownerId: { type: Schema.Types.ObjectId, required: true },
    attendees: { type: [Schema.Types.ObjectId], default: [] },
    image_paths: { type: [String], default: [] },
});

export const Event = model<IEvent, TEventModel>('Event', eventSchema);
export type TEvent = InferRawDocType<typeof eventSchema>;