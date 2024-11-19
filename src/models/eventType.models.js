import mongoose, {Schema} from 'mongoose';

const eventTypeSchema = new Schema({
    name: { type: String, required: true , unique: true},
    is_group: { type: Boolean, required: true },
    count_min: { type: Number, required: function() { return this.is_group; } },
    count_max: { type: Number, required: function() { return this.is_group; } },
    scores: {
        first: { type: Number, required: true },
        second: { type: Number, required: true },
        third: { type: Number, required: true },
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

export const EventType = mongoose.model("EventType", eventTypeSchema);