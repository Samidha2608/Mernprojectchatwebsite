import { useState, useEffect } from "react";
import { Cog, EllipsisVertical, PenSquare, Plus, Trash2, Users } from "lucide-react";
import CreateGroupModal from "./CreateGroupModel";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import Model from "./Model";
import SettingModel from "./SettingModel";
import ImageViewModal from "./ImagePreview";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { users, getUsers, isUsersLoading, selectedUser, setSelectedUser, unreadMessages } = useChatStore();
  const { groups, getUserGroups, isGroupsLoading, selectedGroup, setSelectedGroup, unreadGroupMessages, deleteGroup } = useGroupStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  
  // New state for image modal
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageSrc: "",
    altText: ""
  });

  useEffect(() => {
    getUsers();
    getUserGroups();
  }, [getUsers, getUserGroups]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  // New function to open image modal
  const openImageModal = (e, imageSrc, altText) => {
    e.stopPropagation(); // Prevent selecting the user/group when clicking the image
    setImageModal({
      isOpen: true,
      imageSrc,
      altText
    });
  };

  // Function to close image modal
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageSrc: "",
      altText: ""
    });
  };

  const totalUnreadDirectMessages = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  const totalUnreadGroupMessages = Object.values(unreadGroupMessages).reduce((sum, count) => sum + count, 0);

  const deleteGroupModal = (groupData) => {
    setSelectedGroupData(groupData);
    document.getElementById('my_modal_3').showModal();
  };
  
  const deleteGroupfn = async (groupId) => {
    await deleteGroup(groupId);
    document.getElementById('my_modal_3').close();
  };
  
  return (
    <aside className="flex flex-col h-full bg-base-100 border-r border-base-300 w-full md:w-72 lg:w-80">
      {/* Fixed Top Section with Shadow */}
      <div className="sticky top-0 z-10 bg-base-100 shadow-sm">
        {/* Tab Container */}
        <div className="p-2 sm:p-3">
          <div className="grid grid-cols-2 gap-1 bg-base-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("chats")}
              className={`relative flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === "chats"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-base-300 text-base-content"
                }`}
            >
              Chats
              {totalUnreadDirectMessages > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-5 h-5 flex items-center justify-center px-1 bg-error text-white text-xs font-bold rounded-full">
                  {totalUnreadDirectMessages}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`relative flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === "groups"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-base-300 text-base-content"
                }`}
            >
              Groups
              {totalUnreadGroupMessages > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-5 h-5 flex items-center justify-center px-1 bg-error text-white text-xs font-bold rounded-full">
                  {totalUnreadGroupMessages}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-3 py-2 flex items-center justify-between">
          {activeTab === "chats" ? (
            <h2 className="text-base font-semibold">Direct Messages</h2>
          ) : (
            <>
              <h2 className="text-base font-semibold">Groups</h2>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-2">
          {activeTab === "chats" ? (
            isUsersLoading ? (
              <div className="flex justify-center p-4">
                <div className="loading loading-spinner" />
              </div>
            ) : (
              <ul className="space-y-1">
                {users.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200
                      ${selectedUser?._id === user._id
                        ? "bg-base-200 shadow-sm"
                        : "hover:bg-base-200/70"
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-11 h-11 rounded-full overflow-hidden bg-base-300 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => openImageModal(e, user.profilePic || "/avatar.png", user.fullName)}
                      >
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {unreadMessages[user._id] > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1 bg-error text-white text-xs font-bold rounded-full">
                          {unreadMessages[user._id]}
                        </span>
                      )}
                      {onlineUsers.includes(user._id) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-base-100" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate leading-5">{user.fullName}</h3>
                      <p className="text-sm text-base-content/70 truncate">
                        {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            isGroupsLoading ? (
              <div className="flex justify-center p-4">
                <div className="loading loading-spinner" />
              </div>
            ) : (
              <ul className="space-y-1">
                {groups.map((group) => (
                  <li
                    key={group._id}
                    onClick={() => handleGroupSelect(group)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200
                      ${selectedGroup?._id === group._id
                        ? "bg-base-200 shadow-sm"
                        : "hover:bg-base-200/70"
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => group.groupPic ? openImageModal(e, group.groupPic, group.name) : null}
                      >
                        {
                          group.groupPic ? (
                            <img
                              src={group.groupPic}
                              alt={group.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <Users size={20} />
                          )
                        }
                      </div>
                      {unreadGroupMessages[group._id] > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1 bg-error text-white text-xs font-bold rounded-full">
                          {unreadGroupMessages[group._id]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate leading-5">{group.name}</h3>
                      <p className="text-sm text-base-content/70 truncate">
                        {group.members.length} members
                      </p>
                    </div>
                    {
                      group.admin._id === authUser._id &&
                      <div className={`dropdown dropdown-bottom dropdown-end`}
                      onClick={(e) => e.stopPropagation()}>
                        <div tabIndex={0} role="button" className="m-1 block"><EllipsisVertical /></div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                          <li onClick={() => {
                            document.getElementById('my_modal_4').showModal()
                            setSelectedGroupData(group)
                          }}><a><Cog />Group Setting</a></li>
                          <li className="text-red-500" onClick={() => deleteGroupModal(group)}><a> <Trash2 /> Delete Group</a></li>
                        </ul>
                      </div>
                    }
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {isCreateGroupOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => {
            setIsCreateGroupOpen(false);
            setSelectedGroupData(null);
          }}
        />
      )}
      <Model fn={deleteGroupfn} selectedGroupData={selectedGroupData} />
      <SettingModel groupData={selectedGroupData} setSelectedGroupData={setSelectedGroupData} />
      
      {/* Image View Modal */}
      <ImageViewModal 
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageSrc={imageModal.imageSrc}
        altText={imageModal.altText}
      />
    </aside>
  );
};

export default Sidebar;