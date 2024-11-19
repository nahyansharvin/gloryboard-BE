import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema({
  name: { type: String, required: true },
  event_type: { type: Schema.Types.ObjectId, ref: "EventType", required: true },
//   date: { type: Date, required: true }, scheduling info 
});


export const Event = mongoose.model("Event", eventSchema);