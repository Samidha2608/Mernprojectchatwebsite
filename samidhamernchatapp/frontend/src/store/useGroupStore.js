import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { persist } from "zustand/middleware";

export const useGroupStore = create(
  persist(
    (set, get) => ({
      groups: [],
      selectedGroup: null,
      groupMessages: [],
      isGroupsLoading: false,
      isGroupMessagesLoading: false,
      isCreatingGroup: false,
      isUpdatingGroup: false,
      unreadGroupMessages: {},

      // Get all groups for the current user
      getUserGroups: async () => {
        set({ isGroupsLoading: true });
        try {
          const res = await axiosInstance.get("/groups");
          set({ groups: res.data });
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load groups");
        } finally {
          set({ isGroupsLoading: false });
        }
      },

      // Create a new group
      createGroup: async (groupData) => {
        set({ isCreatingGroup: true });
        try {
          const res = await axiosInstance.post("/groups/create", groupData);
          set({ groups: [...get().groups, res.data] });
          toast.success("Group created successfully");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to create group");
          throw error;
        } finally {
          set({ isCreatingGroup: false });
        }
      },

      // Get group details
      getGroupDetails: async (groupId) => {
        try {
          const res = await axiosInstance.get(`/groups/${groupId}`);
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load group details");
          throw error;
        }
      },

      // Update group
      updateGroup: async (groupId, data) => {
        set({ isUpdatingGroup: true });
        try {
          const res = await axiosInstance.put(`/groups/${groupId}/update`, data);

          // Update the groups list and selected group if it's the one being updated
          set(state => ({
            groups: state.groups.map(g => g._id === groupId ? res.data : g),
            selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
          }));

          toast.success("Group updated successfully");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update group");
          throw error;
        } finally {
          set({ isUpdatingGroup: false });
        }
      },

      // Delete group
      deleteGroup: async (groupId) => {
        try {
          await axiosInstance.delete(`/groups/${groupId}`);

          // Remove from groups list and clear selection if it was selected
          set(state => ({
            groups: state.groups.filter(g => g._id !== groupId),
            selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup
          }));

          toast.success("Group deleted successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete group");
          throw error;
        }
      },

      // Add members to group
      addMembers: async (groupId, memberIds) => {
        try {
          const res = await axiosInstance.post(`/groups/${groupId}/members`, { members: memberIds });

          // Update groups list and selected group if needed
          set(state => ({
            groups: state.groups.map(g => g._id === groupId ? res.data : g),
            selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
          }));

          toast.success("Members added successfully");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to add members");
          throw error;
        }
      },

      // Remove member from group
      removeMember: async (groupId, memberId) => {
        try {
          const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);

          // Update groups list and selected group if needed
          set(state => ({
            groups: state.groups.map(g => g._id === groupId ? res.data : g),
            selectedGroup: state.selectedGroup?._id === groupId ? res.data : state.selectedGroup
          }));

          toast.success("Member removed successfully");
          return res.data;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to remove member");
          throw error;
        }
      },

      // Get messages for a group
      getGroupMessages: async (groupId) => {
        set({ isGroupMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/groups/${groupId}/messages`);
          set({
            groupMessages: res.data,
            // Clear unread count when opening a group chat
            unreadGroupMessages: {
              ...get().unreadGroupMessages,
              [groupId]: 0
            }
          });

          // Make sure to join the group room when getting messages
          const socket = useAuthStore.getState().socket;
          if (socket) {
            socket.emit("joinGroup", groupId);
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to load messages");
        } finally {
          set({ isGroupMessagesLoading: false });
        }
      },

      // Send message to group
      sendGroupMessage: async (messageData) => {
        const { selectedGroup, groupMessages } = get();
        if (!selectedGroup) {
          toast.error("No group selected");
          return;
        }
        // Create an optimistic message
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage = {
          _id: optimisticId,
          text: messageData.text,
          image: messageData.image,
          senderId: {
            _id: useAuthStore.getState().authUser._id
          },
          groupId: selectedGroup._id,
          createdAt: new Date().toISOString(),
          isOptimistic: true, // Flag to identify optimistic messages
        };

        // Update UI immediately with optimistic message
        set({ groupMessages: [...groupMessages, optimisticMessage] });
        try {
          const res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
          // set({ groupMessages: [...groupMessages, res.data] });
          set({
            groupMessages: groupMessages
              .filter(msg => msg._id !== optimisticId)
              .concat(res.data)
          });
          return res.data;
        } catch (error) {
          // Remove optimistic message on error
          set({
            groupMessages: groupMessages.filter(msg => msg._id !== optimisticId)
          });
          toast.error(error.response?.data?.message || "Failed to send message");
          throw error;
        }
      },

      deleteGroupMessage:async(groupMessageId)=>{
        try {
          // Optimistically remove the message from the UI
          set(state => ({
            groupMessages: state.groupMessages.map(msg => 
              msg._id === groupMessageId ? { ...msg, isDeleting: true } : msg
            )
          }));

          // Call the API to delete the message
          await axiosInstance.delete(`groups/messages/${groupMessageId}`);
          
          // Remove the message from state after successful deletion
          set(state => ({
            groupMessages: state.groupMessages.filter(msg => msg._id !== groupMessageId)
          }));
          
          return true;
        } catch (error) {
          // Revert the optimistic update if deletion fails
          set(state => ({
            messages: state.messages.map(msg =>
              msg._id === groupMessageId ? { ...msg, isDeleting: false } : msg
            )
          }));
          toast.error("Failed to delete message");
          return false;
        }
      },

      // Subscribe to group message updates
      subscribeToGroupMessages: () => {
        const { selectedGroup } = get();
        if (!selectedGroup) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) {
          console.error("Socket not connected");
          return;
        }

        // Make sure we're in the group room
        socket.emit("joinGroup", selectedGroup._id);

        // Remove any existing listeners to avoid duplicates
        socket.off("newGroupMessage");

        socket.on("newGroupMessage", (newMessage) => {
          // Only update messages if it's for the currently selected group
          if (newMessage.groupId === selectedGroup._id) {
            set(state => ({
              groupMessages: [...state.groupMessages, newMessage],
            }));
          }
        });

        // Subscribe to group updates
        socket.off("groupUpdated");
        socket.on("groupUpdated", (updatedGroup) => {
          set(state => ({
            groups: state.groups.map(g => g._id === updatedGroup._id ? updatedGroup : g),
            selectedGroup: state.selectedGroup?._id === updatedGroup._id ? updatedGroup : state.selectedGroup
          }));
        });

        // Handle being removed from group
        socket.off("removedFromGroup");
        socket.on("removedFromGroup", ({ groupId }) => {
          set(state => ({
            selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
            groups: state.groups.filter(g => g._id !== groupId)
          }));
        });

         // Listen for message deletion events
         socket.on("groupMessageDeleted", (messageId) => {
          set(state => ({
            groupMessages: state.groupMessages.filter(message => message._id !== messageId)
          }));
        });
      },

      // Track unread messages for all groups
      subscribeToUnreadGroupMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) {
          console.log("Socket not connected, cannot subscribe to unread group messages");
          // Try to reconnect socket
          setTimeout(() => {
            const authUser = useAuthStore.getState().authUser;
            if (authUser && !useAuthStore.getState().socket) {
              useAuthStore.getState().connectSocket();
            }
          }, 1000);
          return;
        }

        // Remove existing listener to avoid duplicates
        socket.off("newGroupMessage");

        socket.on("newGroupMessage", (newMessage) => {
          const { selectedGroup } = get();
          // If message is for a different group than the one currently open, increment unread count
          if (!selectedGroup || newMessage.groupId !== selectedGroup._id) {
            set(state => {
              const currentCount = state.unreadGroupMessages[newMessage.groupId] || 0;
              return {
                unreadGroupMessages: {
                  ...state.unreadGroupMessages,
                  [newMessage.groupId]: currentCount + 1
                }
              };
            });
          }
        });

        console.log("Subscribed to unread group messages");

      },

      // Unsubscribe from group updates
      unsubscribeFromGroupMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        const { selectedGroup } = get();
        if (selectedGroup) {
          socket.emit("leaveGroup", selectedGroup._id);
        }
        socket.off("newGroupMessage");
        socket.off("groupUpdated");
        socket.off("removedFromGroup");

        console.log("Unsubscribed from group messages");
      },

      // Set the selected group and clear unread count
      setSelectedGroup: (group) => {
        const previousGroup = get().selectedGroup;

        // Leave previous group room if any
        if (previousGroup) {
          const socket = useAuthStore.getState().socket;
          if (socket) {
            socket.emit("leaveGroup", previousGroup._id);
          }
        }

        set(state => {
          if (group) {
            // Join new group room
            const socket = useAuthStore.getState().socket;
            if (socket) {
              socket.emit("joinGroup", group._id);
            }
            // Clear unread count when selecting a group
            return {
              selectedGroup: group,
              unreadGroupMessages: {
                ...state.unreadGroupMessages,
                [group._id]: 0
              }
            };
          } else {
            return { selectedGroup: null };
          }
        });
      },

      // Clear all unread counts for a specific group
      clearUnreadGroupMessages: (groupId) => {
        set(state => ({
          unreadGroupMessages: {
            ...state.unreadGroupMessages,
            [groupId]: 0
          }
        }));
      },

      // Join a group's socket room
      joinGroupRoom: (groupId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.emit("joinGroup", groupId);
          console.log("Manually joining group room:", groupId);
        }
      },

      // Leave a group's socket room
      leaveGroupRoom: (groupId) => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.emit("leaveGroup", groupId);
          console.log("Manually leaving group room:", groupId);
        }
      },
    }),
    {
      name: "group-storage", // name for the localStorage key
      partialize: (state) => ({ unreadGroupMessages: state.unreadGroupMessages }), // only persist unreadGroupMessages
    }
  )
);