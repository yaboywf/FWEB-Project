import { Schema, model } from "mongoose";

const AchievementSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true
        },
        difficulty: {
            type: Number,
            enum: [1, 2, 3],
            required: true
        }
    },
    {
        collection: "achievements"
    }
);

export default model("Achievement", AchievementSchema);