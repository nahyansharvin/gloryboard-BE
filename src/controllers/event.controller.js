import { Event } from "../models/event.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const fetchAllEvents = asyncHandler(async (req, res, next) => {
  const events = await Event.find();

  if (!events) {
    return next(new ApiError("No events found", 404));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, events, "Events fetched successfully"));
});

const createEvent = asyncHandler(async (req, res, next) => {
  const { name, event_type } = req.body;

  if (!name || !event_type) {
    return next(new ApiError("Please provide name and eventTypeId", 400));
  }

  const existingEvent = await Event.findOne({
    name,
    event_type,
  });

  if (existingEvent) {
    return next(new ApiError("Event already exists", 409));
  }

  const event = await Event.create({
    name,
    event_type 
  });

  const createdEvent = await Event.findById(event._id);

  if (!createdEvent) {
    return next(new ApiError("Failed to create event", 500));
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdEvent, "Event created successfully"));
});

const updateEvent = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, event_type } = req.body;

    const event = await Event.findById(id);

    if (!event) {
        return next(new ApiError("Event not found", 404));
    }

    if (name) event.name = name;
    if (event_type) event.event_type = event_type;

    await event.save();

    const updatedEvent = await Event.findById(id);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});


const deleteEvent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const event = await Event.findByIdAndDelete(id);

  if (!event) {
    return next(new ApiError("Event not found", 404));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Event deleted successfully"));
});

export { fetchAllEvents, createEvent , updateEvent , deleteEvent};
