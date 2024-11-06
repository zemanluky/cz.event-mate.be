import * as mongoose from "mongoose";

/**
 * Creates a mongoose instance for working with mongoose schemas.
 * It connects to a MongoDB instance via the DSN provided in the environment.
 */
export const connectToMongo = async (): Promise<mongoose.Mongoose> => {
    const connectionString = process.env.MONGO_DSN;

    if (!connectionString)
        throw new Error(
            'The connection string to a MongoDB instance is not set in the environment. '
            + 'Please, set the MONGO_DSN env variable accordingly.'
        );

    return mongoose.connect(connectionString);
}