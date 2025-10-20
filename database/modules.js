import { Schema, model } from "mongoose";

const ModuleSchema = new Schema(
    {
        module: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function (value) {
                    return /\([A-Z]{1,6}\)/.test(value);
                },
                message: "Module name must include brackets containing 1–6 uppercase letters, e.g. 'Computational Thinking (COMT)'."
            }
        },
    },
    {
        timestamps: true,
        collection: "modules"
    }
);

export default model("Module", ModuleSchema);