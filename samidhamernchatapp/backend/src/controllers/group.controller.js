import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import Group from "../models/group.model.js";
import GroupMessage from "../models/groupmessage.model.js";


// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    let { groupPic } = req.body;
    const admin = req.user._id;

    // Validate group name
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Include the admin in members if not already included
    if (!members.includes(admin.toString())) {
      members.push(admin.toString());
    }

    // Upload group picture if provided
    let groupPicUrl = "";
    if (groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPicUrl = uploadResponse.secure_url;
    }

    // Create the group
    const newGroup = new Group({
      name,
      description,
      members,
      admin,
      groupPic: groupPicUrl,
    });

    await newGroup.save();

    // Populate the members to get their full information
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members via socket
    members.forEach((memberId) => {
      // Get socket ID for each member
      const memberSocketId = io.sockets.adapter.rooms.get(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("newGroup", populatedGroup);
      }
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error in createGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all groups for the current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "-password")
      .populate("admin", "-password");

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getUserGroups controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get group details
export const getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate("members", "-password")
      .populate("admin", "-password");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member of the group
    if (!group.members.some((member) => member._id.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupDetails controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add members to a group
export const addMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is the admin
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Add new members
    const updatedMembers = [...new Set([...group.members.map(m => m.toString()), ...members])];

    group.members = updatedMembers;
    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify new members
    members.forEach((memberId) => {
      const memberSocketId = io.sockets.adapter.rooms.get(memberId);
      if (memberSocketId) {
        io.to(memberSocketId).emit("addedToGroup", updatedGroup);
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in addMembers controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove a member from a group
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is the admin or removing themselves
    if (group.admin.toString() !== userId.toString() && memberId !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Cannot remove the admin
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ message: "Cannot remove the admin from the group" });
    }

    // Remove the member
    group.members = group.members.filter(m => m.toString() !== memberId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify the removed member
    const memberSocketId = io.sockets.adapter.rooms.get(memberId);
    if (memberSocketId) {
      io.to(memberSocketId).emit("removedFromGroup", { groupId, groupName: group.name });
    }

    // Notify remaining members
    group.members.forEach((id) => {
      const socketId = io.sockets.adapter.rooms.get(id.toString());
      if (socketId) {
        io.to(socketId).emit("memberRemoved", { groupId, memberId });
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in removeMember controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update group details
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    let { groupPic } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is the admin
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can update group details" });
    }

    // Update group picture if provided
    if (groupPic && groupPic !== group.groupPic) {
      const uploadResponse = await cloudinary.uploader.upload(groupPic);
      groupPic = uploadResponse.secure_url;
    } else {
      groupPic = group.groupPic;
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      id,
      {
        name: name || group.name,
        description: description || group.description,
        groupPic,
      },
      { new: true }
    )
      .populate("members", "-password")
      .populate("admin", "-password");

    // Notify all members about the update
    group.members.forEach((memberId) => {
      const memberSocketId = io.sockets.adapter.rooms.get(memberId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupUpdated", updatedGroup);
      }
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error in updateGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a group
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is the admin
    if (group.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only admin can delete the group" });
    }

    // Store members before deletion for notification
    const members = [...group.members];
    const groupName = group.name;

    // Delete all messages for the group
    await GroupMessage.deleteMany({ groupId: id });

    // Delete the group
    await Group.findByIdAndDelete(id);

    // Notify all members about the deletion
    members.forEach((memberId) => {
      const memberSocketId = io.sockets.adapter.rooms.get(memberId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupDeleted", { groupId: id, groupName });
      }
    });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Send a message to a group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Upload image if provided
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Create and save the message
    const newMessage = new GroupMessage({
      groupId,
      senderId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Populate sender information for the client
    const populatedMessage = await GroupMessage.findById(newMessage._id)
      .populate("senderId", "fullName profilePic");

    io.to(`group:${groupId}`).emit("newGroupMessage", populatedMessage);

     // For reliability, also emit to each member individually
     group.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const memberSocketId = io.sockets.adapter.rooms.get(memberId.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("newGroupMessage", populatedMessage);
        }
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get messages for a group
export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some(m => m.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Get messages and populate sender information
    const messages = await GroupMessage.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a group message
export const deleteGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find the message
    const message = await GroupMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the user is the sender of the message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Get the group to notify members after deletion
    const group = await Group.findById(message.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Delete the message
    await GroupMessage.findByIdAndDelete(messageId);

    // Notify all group members about the deletion
    io.to(`group:${message.groupId}`).emit("groupMessageDeleted", messageId);

    // For reliability, also emit to each member individually
    group.members.forEach((memberId) => {
      const memberSocketId = io.sockets.adapter.rooms.get(memberId.toString());
      if (memberSocketId) {
        io.to(memberSocketId).emit("groupMessageDeleted", messageId);
      }
    });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroupMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};