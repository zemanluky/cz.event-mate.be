import { Event, type IEvent } from "../schema/db/event.schema";
import { NotFoundError } from "../error/response/not-found.error";
import { BadRequestError } from "../error/response/bad-request.error";
import { ServerError } from "../error/response/server.error";

export async function getEvent(id: string): Promise<IEvent> {
  if (!id) {
    throw new BadRequestError("Missing path parameter", "id");
  }
  try {
    const event = await Event.findById(id);

    if (!event)
      throw new NotFoundError(`Could not find event with ID: ${id}.`, "event");

    return event.toObject();
  } catch (error) {
    throw new ServerError("Server error, GET /event/:id");
  }
}

export async function createEvent(event: IEvent): Promise<IEvent> {
  if (!event) {
    throw new BadRequestError("Missing request body", "event");
  }

  if (!event.date) {
    event.date = new Date();
  }

  try {
    const newEvent = new Event(event);
    const savedEvent = await newEvent.save();
    return savedEvent.toObject();
  } catch (error) {
    throw new ServerError("Server error, POST /event/create");
  }
}

export async function updateEvent(id: string,updates: IEvent): Promise<IEvent> {
  if (!id) {
    throw new BadRequestError("Missing path parameter", "id");
  }
  if (!updates) {
    throw new BadRequestError("Missing request body", "updates");
  }
  try {
    const updatedEvent = await Event.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent)
      throw new NotFoundError(`Could not find event with ID: ${id}.`, "event");

    return updatedEvent.toObject();
  } catch (error) {
    throw new ServerError("Server error, PUT /event/:id");
  }
}
