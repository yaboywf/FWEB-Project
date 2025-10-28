import { Schema, model } from "mongoose";
import User from "./users.js";
import Module from "./modules.js";

const ProficiencySchema = new Schema(
    {
        student_id: {
            type: String,
            required: true,
            validate: {
                validator: async function (value) {
                    const exists = await User.exists({ student_id: value });
                    return !!exists;
                },
                message: (props) => `student_id '${props.value}' does not exist`
            }
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
        type: {
            type: Number,
            enum: [1, 2],
            required: true
        }
    },
    {
        collection: "proficiencies"
    }
);

ProficiencySchema.post("init", function () {
    const schemaKeys = Object.keys(this.schema.paths);

    for (const key of Object.keys(this._doc)) {
        if (!schemaKeys.includes(key)) {
            delete this._doc[key];
        }
    }
});

ProficiencySchema.pre("save", function (next) {
    const schemaKeys = Object.keys(this.schema.paths);

    for (const key of Object.keys(this._doc)) {
        if (!schemaKeys.includes(key)) {
            delete this._doc[key];
        }
    }
    next();
});

export default model("Proficiency", ProficiencySchema);