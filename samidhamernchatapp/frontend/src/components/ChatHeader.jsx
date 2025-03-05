import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

const ChatHeader = ({ isGroupChat }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { selectedGroup, setSelectedGroup } = useGroupStore();
  const { onlineUsers } = useAuthStore();


  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={isGroupChat ? selectedGroup?.groupPic || "/avatar.png"  : selectedUser?.profilePic || "/avatar.png"} alt="img" />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{isGroupChat ? selectedGroup?.name : selectedUser?.fullName}</h3>
            {
              isGroupChat ? (
                <span className="text-gray-500 text-xs">
                {selectedGroup.members.length > 7
                  ? `${selectedGroup.members.slice(0, 4).map(member => member.fullName).join(', ')}...`
                  : selectedGroup.members.map(member => member.fullName).join(', ')
                }
              </span>
              ) : (
                <p className="text-sm text-base-content/70">
                  {onlineUsers?.includes(selectedUser?._id) ? "Online" : "Offline"}
                </p>
              )
            }
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => isGroupChat ? setSelectedGroup(null) : setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;