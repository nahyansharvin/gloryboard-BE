import mongoose, {Schema} from 'mongoose';

const eventTypeSchema = new Schema({
    name: { type: String, required: true , unique: true},
    is_group: { type: Boolean, required: true },
    participant_count: {type: Number, required: true},
    helper_count: {type: Number, required: true},
    scores: {
        first: { type: Number, required: true },
        second: { type: Number, required: true },
        third: { type: Number, required: true },
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

export const EventType = mongoose.model("EventType", eventTypeSchema);