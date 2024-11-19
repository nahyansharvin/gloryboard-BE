import { Schema , model } from 'mongoose';

const resultSchema = new Schema({
    event: { type: Schema.Types.ObjectId, ref: "Event", required : true },
    winningRegistration: { type: Schema.Types.ObjectId, ref: "EventRegistration", required : true },
    scores: [{
        registration: { type: Schema.Types.ObjectId, ref: "EventRegistration", required : true },
        score: { type: Number, required : true }
    }], 
});

export const Result = model("Result", resultSchema);