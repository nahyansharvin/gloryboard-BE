import { EventType } from "../models/eventType.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const fetchAllEventTypes = asyncHandler(async (req, res, next) => {
  const eventTypes = await EventType.find();

  if (!eventTypes) {
    return next(new ApiError("No event types found", 404));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, eventTypes, "Event types fetched successfully"));
});

const createEventType = asyncHandler(async (req, res, next) => {
  const {
    name,
    is_group = false,
    participant_count = 1,
    helper_count = 0,
    scores,
  } = req.body;

  if (!name || !scores.first || !scores.second || !scores.third) {
    return next(
      new ApiError(
        "Please provide name, scores.first, scores.second, and scores.third",
        400
      )
    );
  }

  const existingEventType = await EventType.findOne({
    name,
    is_group,
  });

  if (existingEventType) {
    return next(new ApiError("Event type already exists", 409));
  }

  const eventType = await EventType.create({
    name,
    participant_count,
    helper_count,
    is_group,
    scores,
  });

  const createdEventType = await EventType.findById(eventType._id);

  if (!createdEventType) {
    return next(new ApiError("Failed to create event type", 500));
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdEventType, "Event type created successfully")
    );
});

export { fetchAllEventTypes , createEventType };
