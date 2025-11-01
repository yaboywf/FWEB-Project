import { Schema, model } from "mongoose";
import Achievement from "./achievements.js";
import User from "./users.js";

const AttainedSchema = new Schema(
    {
        student_id: {
            type: String,
            required: true,
            validate: {
                validator: async function (id) {
                    const user = await User.findOne({ student_id: id });
                    if (!user) return false;
                    return true;
                }
            }
        },
        achieved_date: {
            type: Date,
            required: true
        },
        achievement_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Achievement",
            validate: {
                validator: async function (id) {
                    const achievement = await Achievement.findById(id);
                    if (!achievement) return false;
                    return true;
                }
            }
        }
    },
    {
        collection: "attained_achievements"
    }
);

AttainedSchema.index({ student_id: 1, achievement_id: 1 }, { unique: true });
export default model("Attained", AttainedSchema);