import type {TFoo as TFooApi} from "../schema/request/foo.schema.ts";
import {Foo, type IFoo, type TFoo} from "../schema/db/foo.schema.ts";
import {NotFoundError} from "../error/request/not-found.error.ts";

/**
 * Saves Foo data from API to the database collection.
 * @param apiData
 */
export const saveFromApi = async (apiData: TFooApi): Promise<string> => {
    const foo = new Foo({
        surname: 'random!',
        name: apiData.name,
        email: apiData.email,
        number: apiData.number
    });
    const document = await foo.save();

    return document._id.toString();
}

/**
 * Finds a Foo by its id.
 * Throws error when not found.
 * @param id
 */
export const findById = async (id: string): Promise<IFoo> => {
    const document = await Foo.findById(id).exec();

    if (document === null)
        throw new NotFoundError(`Could not find the requested foo with id ${id}.`, 'foo');

    return document.toObject();
}