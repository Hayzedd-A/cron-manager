import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    query: { type: Object },
    active: { type: Boolean, default: true },
    lastPing: { type: Date },
    status: { type: String, enum: ["up", "down"], default: "down" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastResponse: { text: { type: String }, code: { type: Number } },
    history: [
      {
        response: { text: { type: String }, code: { type: Number } },
        timestamp: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export const Service =
  mongoose.models.Service || mongoose.model("Service", ServiceSchema);
