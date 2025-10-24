import { Schema, model } from "mongoose";

const UserSchema = new Schema(
    {
        student_id: {
            type: String,
            required: true,
            set: v => v?.toUpperCase(),
            validate: {
                validator: function (value) {
                    const pattern = /^[0-9]{7}[A-Z]$/;
                    if (!pattern.test(value)) return false;

                    const currentYear = new Date().getFullYear() % 100;
                    const admissionYear = parseInt(value.substring(0, 2), 10);
                    const yearDiff = (currentYear - admissionYear + 100) % 100;
                    return yearDiff <= 5;
                },
                message: "Student ID invalid",
            },
        },
        name: {
            type: String,
            required: true,
            set: function (value) {
                if (!value) return value;
                return value.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
            }
        },
        diploma: {
            type: String,
            required: true,
            set: function (value) {
                if (!value) return value;

                value = value.trim();
                return value.startsWith("Diploma in") ? value : `Diploma in ${value.replace(/^Diploma\s+in\s*/i, "").trim()}`;
            },
        },
        year_of_study: {
            type: Number,
            enum: [1, 2, 3],
            required: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        image: {
            type: String,
        },
        rating: {
            type: Array,
            default: []
        }
    }
);

UserSchema.index({ student_id: 1 }, { unique: true });
export default model("User", UserSchema);