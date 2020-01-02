"use strict";
import mongoose from "mongoose";

const Schema = mongoose.Schema;
const table = "RoomParticipants";
const collectionSchema = new Schema(
  {
    room_id: {
      type: Schema.Types.ObjectId,
      ref: "Rooms"
    },
    user_id: String,
    type: String,
    mute: { type: Boolean, default: false },
    publish: { type: Number, default: 1 },
    deleted: { type: Number, default: 0, min: 0, max: 3 },
    account: String,
    typeRoom: String,
    modity_date: { type: Date, default: Date.now },
    create_date: { type: Date },
    last_online : { type: Date, default: Date.now }
  },
  { collection: table }
);
module.exports = mongoose.model(table, collectionSchema);
