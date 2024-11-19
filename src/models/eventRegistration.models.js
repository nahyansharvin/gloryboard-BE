import mongoose, { Schema } from "mongoose";

const eventRegistrationSchema = new Schema({
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    group_name: { type: String, required: function() { return this.event.is_group; } },
    participants : [{
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        score: { type: Number, default: 0 }, // Score obtained in this event by the user
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

export const EventRegistration = mongoose.model("EventRegistration", eventRegistrationSchema);