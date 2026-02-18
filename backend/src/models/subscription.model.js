
import mongoose, { Schema } from "mongoose";
const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId, // person who subscribes
    ref: "User",
    required: true,
  },
  subscribedTo: {
    type: Schema.Types.ObjectId, // the channel being subscribed to
    ref: "User",
    required: true,
  },
}, { timestamps: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);