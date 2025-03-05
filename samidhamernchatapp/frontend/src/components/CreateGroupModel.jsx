import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  
  const { authUser } = useAuthStore();
  const { users } = useChatStore();
  const { createGroup, isCreatingGroup } = useGroupStore();

  // Filter users based on search query
  const filteredUsers = users.filter(user => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
  };

  const handleCreateGroup = async () => {
    if (groupName.trim() === "" || selectedUsers.length === 0) return;
    
    await createGroup({
      name: groupName,
      members: [...selectedUsers, authUser?._id],
      groupPic:imagePreview
    });
    
    // Reset form and close modal upon successful creation
    setGroupName("");
    setSelectedUsers([]);
    setImagePreview(null);
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <div className="bg-base-100 rounded-lg w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-4 btn btn-ghost btn-sm btn-circle"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-2">Create New Group</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between w-full ">
             {/* Group Image Upload */}
           <div className="form-control w-1/2">
            <label className="label">
              <span className="label-text mb-2">Group Photo:</span>
            </label>
            <div className="flex items-center justify-center">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Group preview" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-22 h-22 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-primary">
                  <Upload size={20} />
                  <span className="text-xs mt-2">Upload Photo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Group Name Input */}
          <div className="form-control w-1/2">
            <label className="label">
              <span className="label-text">Group Name</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          </div>
          
          {/* Search Users */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Add Members</span>
            </label>
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* User Selection List */}
          <div className="max-h-43 overflow-y-auto border border-base-300 rounded-lg">
            {filteredUsers.length > 0 ? (
              <ul className="divide-y divide-base-300">
                {filteredUsers.map(user => (
                  <li 
                    key={user._id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200 ${
                      selectedUsers.includes(user._id) ? "bg-base-200" : ""
                    }`}
                    onClick={() => handleUserSelect(user._id)}
                  >
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img src={user.profilePic || "/default-avatar.png"} alt={user.name} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{user.fullName}</h4>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
          
          {/* Selected Count */}
          <div className="text-sm text-gray-500">
            {selectedUsers.length} users selected
          </div>
          
          {/* Create Button */}
          <button
            className="btn btn-primary w-full"
            onClick={handleCreateGroup}
            disabled={groupName.trim() === "" || selectedUsers.length === 0 || isCreatingGroup}
          >
            {isCreatingGroup ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;