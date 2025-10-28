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
        image: {
            type: String,
            default: null
        },
        rating: {
            type: [Number],
            default: []
        }
    }
);

UserSchema.index({ student_id: 1 }, { unique: true });

UserSchema.post("init", function (doc) {
    const schemaPaths = Object.keys(UserSchema.paths);

    for (const key of Object.keys(doc._doc)) {
        if (!schemaPaths.includes(key) && key !== "_id") {
            delete doc._doc[key];
        }
    }

    for (const key of schemaPaths) {
        const path = UserSchema.path(key);
        if (path.options && "default" in path.options) {
            if (doc[key] === undefined) {
                doc[key] = typeof path.options.default === "function"
                    ? path.options.default()
                    : path.options.default;
            }
        }
    }
});

UserSchema.pre("save", function (next) {
    const schemaPaths = Object.keys(UserSchema.paths);

    for (const key of Object.keys(this._doc)) {
        if (!schemaPaths.includes(key) && key !== "_id") {
            delete this._doc[key];
        }
    }
    next();
});

export default model("User", UserSchema);