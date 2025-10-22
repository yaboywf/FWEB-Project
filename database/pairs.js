import { Schema, model } from "mongoose";
import User from "./users.js";
import Module from "./modules.js";

const PairsSchema = new Schema(
    {
        sender_id: {
            type: String,
            required: true,
            validate: {
                validator: async function (value) {
                    const exists = await User.exists({ student_id: value });
                    return !!exists;
                },
                message: (props) => `Sender student_id '${props.value}' does not exist`
            }
        },
        receiver_id: {
            type: String,
            required: true,
            validate: {
                validator: async function (value) {
                    const exists = await User.exists({ student_id: value });
                    return !!exists;
                },
                message: (props) => `Receiver student_id '${props.value}' does not exist`
            }
        },
        day: {
            type: Number,
            enum: [1, 2, 3, 4, 5, 6, 7],
            required: true
        },
        start_time: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    const time = value.split(":");
                    return time.length === 2 && time[0] >= 0 && time[0] < 24 && time[1] >= 0 && time[1] < 60;
                },
                message: "Invalid time format. Please use HH:MM format."
            }
        },
        end_time: {
            type: String,
            required: true,
            validate: {
                validator: function (value) {
                    const time = value.split(":");
                    return time.length === 2 && time[0] >= 0 && time[0] < 24 && time[1] >= 0 && time[1] < 60;
                },
                message: "Invalid time format. Please use HH:MM format."
            }
        },
        status: {
            type: Number,
            enum: [1, 2],
            default: 1,
            required: true
        },
        module_id: {
            type: Schema.Types.ObjectId,
            ref: "Module",
            required: true,
            validate: {
                validator: async function (value) {
                    const exists = await Module.exists({ _id: value });
                    return !!exists;
                },
                message: "Referenced module not found.",
            },
        },
        end_date: {
            type: Date,
            required: true,
        }
    },
    {
        collection: "pairs"
    }
);

export default model("Pair", PairsSchema);