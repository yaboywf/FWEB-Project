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
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    const jsDay = value.getDay();
                    const convertedDay = jsDay === 0 ? 7 : jsDay;
                    return this.day === convertedDay;
                },
                message: props => `start_time's day (${props.value.toDateString()}) does not match selected day (${this.day})`
            }
        },
        end_time: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return value > this.start_time;
                },
                message: "End time must be after start time"
            }
        },
        status: {
            type: Number,
            enum: [1, 2],
            default: 1,
            required: true
        },
        module: {
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
    },
    {
        timestamps: true,
        collection: "pairs"
    }
);

export default model("Pair", PairsSchema);