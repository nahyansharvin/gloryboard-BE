import mongoose from "mongoose";
import { Result } from "../models/result.models.js";
import { Event } from "../models/event.models.js";
import { EventRegistration } from "../models/eventRegistration.models.js";
import { EventType } from "../models/eventType.models.js";
import { POSITIONS } from "../constants.js";
import { User } from "../models/user.models.js";

const fetchAllResults = async () => {
  try {
    // Fetch all results, exclude specific fields from the result document and populated collections
    const results = await Result.find()
      .select('-created_at -updated_at -created_by -updated_by -__v') // Exclude from result document
      .populate({
        path: 'event',
        select: '-created_at -updated_at -created_by -updated_by -__v', // Exclude from Event document
        populate: {
          path: 'event_type',
          model: 'EventType',
          select: '-scores -created_at -updated_at -created_by -updated_by -__v ', // Exclude from EventType document
        },
      })
      .populate({
        path: 'winningRegistrations.eventRegistration',
        select: '-created_at -updated_at -created_by -updated_by -__v', // Exclude from EventRegistration document
        populate: {
          path: 'participants.user',
          model: 'User',
          select: '-created_at -updated_at -created_by -updated_by -__v', // Exclude from User document
        },
        populate: {
          path: 'helpers.user',  // Add population for helpers
          model: 'User',
          select: '-created_at -updated_at -created_by -updated_by -__v', // Exclude from User document for helpers
        },
      })
      .populate('updated_by', 'name') // Exclude specific fields from the updated_by user document
      .exec();

    return results;
  } catch (error) {
    throw new Error(error.message);
  }
};

const fetchResultByEventId = async (event_id) => {
  const aggregate = [
    // Step 1: Match specific event ID
    {
      $match: {
        event: new mongoose.Types.ObjectId(event_id),
      },
    },
    // Step 2: Lookup event details only once and project necessary fields early
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "event",
      },
    },
    {
      $unwind: {
        path: "$event",
      },
    },
    // Step 3: Reduce document size by excluding unnecessary fields early
    {
      $project: {
        "event.created_at": 0,
        "event.updated_at": 0,
        "event.__v": 0,
      },
    },
    // Step 4: Unwind the winningRegistrations array
    {
      $unwind: {
        path: "$winningRegistrations",
      },
    },
    // Step 5: Lookup event registrations once
    {
      $lookup: {
        from: "eventregistrations",
        localField: "winningRegistrations.eventRegistration",
        foreignField: "_id",
        as: "winningRegistrations.eventRegistration",
      },
    },
    {
      $unwind: {
        path: "$winningRegistrations.eventRegistration",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Step 6: Lookup user details once for participants and helpers
    {
      $lookup: {
        from: "users",
        localField: "winningRegistrations.eventRegistration.participants.user",
        foreignField: "_id",
        as: "winningRegistrations.eventRegistration.participants.user",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "winningRegistrations.eventRegistration.helpers.user",
        foreignField: "_id",
        as: "winningRegistrations.eventRegistration.helpers.user",
      },
    },
    // Step 7: Project only necessary fields and exclude unnecessary fields
    {
      $project: {
        "winningRegistrations.eventRegistration.participants.user.user_type": 0,
        "winningRegistrations.eventRegistration.participants.user.created_at": 0,
        "winningRegistrations.eventRegistration.participants.user.updated_at": 0,
        "winningRegistrations.eventRegistration.participants.user.__v": 0,
        "winningRegistrations.eventRegistration.helpers.user.user_type": 0,
        "winningRegistrations.eventRegistration.helpers.user.created_at": 0,
        "winningRegistrations.eventRegistration.helpers.user.updated_at": 0,
        "winningRegistrations.eventRegistration.helpers.user.__v": 0,
        "winningRegistrations.eventRegistration.created_at": 0,
        "winningRegistrations.eventRegistration.updated_at": 0,
        "winningRegistrations.eventRegistration.__v": 0,
        "winningRegistrations.eventRegistration.event": 0,
      },
    },
    // Step 8: Group by event and aggregate the winning registrations
    {
      $group: {
        _id: "$event._id",
        name: { $first: "$event.name" },
        winningRegistrations: { $push: "$winningRegistrations" },
      },
    },
    // Step 9: Final projection to ensure clean output
    {
      $project: {
        "winningRegistrations._id": 1,
        "winningRegistrations.position": 1,
        "winningRegistrations.eventRegistration": 1,
        name: 1,
      },
    },
  ];

  const result = await Result.aggregate(aggregate);

  return result;
};

const createResult = async (event_id, winningRegistrations, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(event_id).session(session);

    if (!event) {
      throw new Error("Event not found");
    }

    const eventType = await EventType.findById(event.event_type).session(
      session
    );

    if (!eventType) {
      throw new Error("Event type not found");
    }

    const isGroupEvent = eventType.is_group;

    for (const registration of winningRegistrations) {
      const eventRegistration = await EventRegistration.findById(
        registration.eventRegistration
      ).session(session);

      if (!eventRegistration) {
        throw new Error("Event registration not found");
      }

      const positionScore = eventType.scores[POSITIONS[registration.position]];

      if (!positionScore) {
        throw new Error("Invalid position provided");
      }

      if (isGroupEvent) {
        console.log("Event is group event");
        continue;
      }

      for (const participant of eventRegistration.participants) {
        const user = await User.findById(participant.user).session(session);

        if (!user) {
          throw new Error("User not found");
        }

        participant.score += positionScore;

        user.total_score += positionScore;

        await user.save({ session });
      }

      await eventRegistration.save({ session });
    }

    const result = new Result({
      event: event_id,
      winningRegistrations,
      created_by: user,
      updated_by: user,
    });

    await result.save({ session });

    await session.commitTransaction();
    console.log("Transaction committed");
    return result;
  } catch (error) {
    await session.abortTransaction();
    console.log("Transaction aborted");
    console.error("transaction error", error);
  } finally {
    session.endSession();
  }
};

const deleteResult = async (resultId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the result document
    const result = await Result.findById(resultId).session(session);
    if (!result) throw new Error(`Result not found for ID: ${resultId}`);

    const event = await Event.findById(result.event).session(session);
    if (!event) throw new Error(`Event not found for ID: ${result.event}`);

    const eventType = await EventType.findById(event.event_type).session(
      session
    );
    if (!eventType)
      throw new Error(`Event type not found for ID: ${event.event_type}`);

    const isGroupEvent = eventType.is_group;

    // Revert participant and user scores for non-group events
    for (const registration of result.winningRegistrations) {
      const eventRegistration = await EventRegistration.findById(
        registration.eventRegistration
      ).session(session);

      if (!eventRegistration) {
        throw new Error(
          `Event registration not found for ID: ${registration.eventRegistration}`
        );
      }

      const positionScore = eventType.scores[POSITIONS[registration.position]];
      if (!positionScore) {
        throw new Error(`Invalid position: ${registration.position}`);
      }

      if (!isGroupEvent) {
        // Reverse score updates for each participant
        for (const participant of eventRegistration.participants) {
          const user = await User.findById(participant.user).session(session);

          if (!user) {
            throw new Error(`User not found for ID: ${participant.user}`);
          }

          participant.score -= positionScore;
          user.total_score -= positionScore;

          await user.save({ session });
        }
      }

      // Save reverted event registration changes
      await eventRegistration.save({ session });
    }

    // Delete the result document
    await Result.findByIdAndDelete(resultId).session(session);

    // Commit the transaction
    await session.commitTransaction();
    console.log("Transaction committed successfully");
    return true;
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    console.error("Transaction aborted due to error:", error.message);
    throw new Error(error.message);
  } finally {
    session.endSession();
  }
};

const updateResult = async (
  resultId,
  updatedWinningRegistrations,
  updatedBy
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the result document
    const result = await Result.findById(resultId).session(session);
    if (!result) throw new Error(`Result not found for ID: ${resultId}`);

    const event = await Event.findById(result.event).session(session);
    if (!event) throw new Error(`Event not found for ID: ${result.event}`);

    const eventType = await EventType.findById(event.event_type).session(
      session
    );
    if (!eventType)
      throw new Error(`Event type not found for ID: ${event.event_type}`);

    const isGroupEvent = eventType.is_group;

    // Reverse previous scores if not a group event
    for (const registration of result.winningRegistrations) {
      const eventRegistration = await EventRegistration.findById(
        registration.eventRegistration
      ).session(session);

      if (!eventRegistration) {
        throw new Error(
          `Event registration not found for ID: ${registration.eventRegistration}`
        );
      }

      const positionScore = eventType.scores[POSITIONS[registration.position]];
      if (!positionScore) {
        throw new Error(`Invalid position: ${registration.position}`);
      }

      if (!isGroupEvent) {
        // Revert scores for each participant
        for (const participant of eventRegistration.participants) {
          const user = await User.findById(participant.user).session(session);

          if (!user) {
            throw new Error(`User not found for ID: ${participant.user}`);
          }

          participant.score -= positionScore;
          user.total_score -= positionScore;

          await user.save({ session });
        }
      }

      // Save reverted event registration changes
      await eventRegistration.save({ session });
    }

    // Apply updates for new winningRegistrations
    for (const registration of updatedWinningRegistrations) {
      const eventRegistration = await EventRegistration.findById(
        registration.eventRegistration
      ).session(session);

      if (!eventRegistration) {
        throw new Error(
          `Event registration not found for ID: ${registration.eventRegistration}`
        );
      }

      const positionScore = eventType.scores[POSITIONS[registration.position]];
      if (!positionScore) {
        throw new Error(`Invalid position: ${registration.position}`);
      }

      if (!isGroupEvent) {
        // Apply scores for each participant
        for (const participant of eventRegistration.participants) {
          const user = await User.findById(participant.user).session(session);

          if (!user) {
            throw new Error(`User not found for ID: ${participant.user}`);
          }

          participant.score += positionScore;
          user.total_score += positionScore;

          await user.save({ session });
        }
      }

      // Save updated event registration changes
      await eventRegistration.save({ session });
    }

    // Update the result document with new winning registrations and updated_by
    result.winningRegistrations = updatedWinningRegistrations;
    result.updated_by = updatedBy; // Save the user who performed the update
    await result.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    console.log("Transaction committed successfully");
    return result;
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    console.error("Transaction aborted due to error:", error.message);
    throw new Error(error.message);
  } finally {
    session.endSession();
  }
};

const fetchAllIndividualResults = async () => {

  const aggregate = [
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "eventDetails"
      }
    },
    {
      $unwind: {
        path: "$eventDetails"
      }
    },
    {
      $lookup: {
        from: "eventtypes",
        localField: "eventDetails.event_type",
        foreignField: "_id",
        as: "eventTypeDetails"
      }
    },
    {
      $unwind: {
        path: "$eventTypeDetails"
      }
    },
    {
      $match: {
        "eventTypeDetails.is_group": false
      }
    },
    {
      $lookup: {
        from: "eventregistrations",
        localField:
          "winningRegistrations.eventRegistration",
        foreignField: "_id",
        as: "winningRegistrationDetails"
      }
    },
    {
      $unwind: {
        path: "$winningRegistrationDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField:
          "winningRegistrationDetails.participants.user",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    {
      $group: {
        _id: "$event",
        eventDetails: { $first: "$eventDetails" },
        eventTypeDetails: {
          $first: "$eventTypeDetails"
        },
        winningRegistrations: {
          $push: {
            registrations:
              "$winningRegistrationDetails",
            participants: "$participantDetails",
            position: {
              $arrayElemAt: [
                "$winningRegistrations.position",
                0
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        // Merge fields from eventDetails into the top-level
        name: "$eventDetails.name",
        eventType : "$eventTypeDetails.name",
        // date: '$eventDetails.date', // Example field from eventDetails
        type: "$eventTypeDetails.type", // Example field from eventTypeDetails
        isGroup: "$eventTypeDetails.is_group"
      }
    },
    {
      $project: {
        _id: 0,
        eventDetails: 0,
        eventTypeDetails: 0,
      }
    }
  ];

  const results = await Result.aggregate(aggregate);

  return results;

};

const fetchAllGroupResults = async () => {
  const aggregate = [
    {
      $lookup: {
        from: "events",
        localField: "event",
        foreignField: "_id",
        as: "eventDetails"
      }
    },
    {
      $unwind: {
        path: "$eventDetails"
      }
    },
    {
      $lookup: {
        from: "eventtypes",
        localField: "eventDetails.event_type",
        foreignField: "_id",
        as: "eventTypeDetails"
      }
    },
    {
      $unwind: {
        path: "$eventTypeDetails"
      }
    },
    {
      $match: {
        "eventTypeDetails.is_group": true
      }
    },
    {
      $lookup: {
        from: "eventregistrations",
        localField:
          "winningRegistrations.eventRegistration",
        foreignField: "_id",
        as: "winningRegistrationDetails"
      }
    },
    {
      $unwind: {
        path: "$winningRegistrationDetails",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField:
          "winningRegistrationDetails.participants.user",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    {
      $group: {
        _id: "$event",
        eventDetails: { $first: "$eventDetails" },
        eventTypeDetails: {
          $first: "$eventTypeDetails"
        },
        winningRegistrations: {
          $push: {
            registrations:
              "$winningRegistrationDetails",
            participants: "$participantDetails",
            position: {
              $arrayElemAt: [
                "$winningRegistrations.position",
                0
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        // Merge fields from eventDetails into the top-level
        name: "$eventDetails.name",
        eventType : "$eventTypeDetails.name",
        // date: '$eventDetails.date', // Example field from eventDetails
        type: "$eventTypeDetails.type", // Example field from eventTypeDetails
        isGroup: "$eventTypeDetails.is_group"
      }
    },
    {
      $project: {
        _id: 0,
        eventDetails: 0,
        eventTypeDetails: 0,
      }
    }
  ]

  const results = await Result.aggregate(aggregate);

  if (!results) {
    throw new Error("No group results found");
  }

  return results;

}




export const resultServices = {
  fetchAllResults,
  fetchResultByEventId,
  createResult,
  updateResult,
  deleteResult,
  fetchAllIndividualResults,
  fetchAllGroupResults
};
