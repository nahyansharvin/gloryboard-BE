import { Schema, model } from "mongoose";

const resultSchema = new Schema({
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  winningRegistrations: [
    {
      eventRegistration: {
        type: Schema.Types.ObjectId,
        ref: "EventRegistration",
        required: true,
      },
      position: { type: Number, required: true },
    },
  ],
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updated_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

resultSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

export const Result = model("Result", resultSchema);
